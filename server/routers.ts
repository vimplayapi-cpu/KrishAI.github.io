import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { analyzePlantImages, askAdvisor, advisorKnowledgeContext, generateReport, recommendCrops, summarizePaper, type AdvisorReply } from "./services/ai";
import { getMarketPrices } from "./services/market";
import { getWeather } from "./services/weather";
import { sdk } from "./_core/sdk";
import { storagePut } from "./storage";
import { INDIA_LOCATIONS } from "@shared/locations";
import { getRecommendations } from "./recommendations";
import { adminRouter } from "./adminRouter";

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/heic"];

function allowedBase64(input: string): { bytes: Buffer; mime: string } {
  const match = input.match(/^data:([a-z0-9+.\-\/]+);base64,(.+)$/i);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Image must be data URL" });
  const mime = match[1]!.toLowerCase();
  if (!ALLOWED_MIME.includes(mime)) throw new TRPCError({ code: "BAD_REQUEST", message: `File type ${mime} not allowed` });
  const bytes = Buffer.from(match[2]!, "base64");
  if (bytes.length > MAX_IMAGE_BYTES) throw new TRPCError({ code: "BAD_REQUEST", message: "Image exceeds 6 MB limit" });
  return { bytes, mime };
}

const todayRecommendation = async (userId: number) => {
  const profile = await db.getProfile(userId);
  if (!profile) return { message: "Loading your profile...", items: [] };
  
  const items = getRecommendations(profile);
  // Pick the highest priority item as the main message
  const top = items.sort((a, b) => (a.priority === "high" ? -1 : 1))[0];
  
  return { 
    message: top ? top.detail : "Stay connected to your field today.", 
    items,
    personalized: profile.onboardingComplete === true 
  };
};

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    /** Password-based login for the demo account (demo / 123456). Signs a JWT
     * session cookie exactly like the OAuth flow, so the rest of the app works
     * unchanged and every protected route stays gated. */
    login: publicProcedure
      .input(z.object({ username: z.string().max(64), password: z.string().max(128), role: z.enum(["farmer", "student"]).optional() }))
      .mutation(async ({ ctx, input }) => {
        const account = await db.getDemoAccount(input.username);
        if (!account || !account.active || !db.verifyPassword(input.password, account.passwordHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password" });
        }
        const user = await db.getUserById(account.userId);
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Linked user missing" });
        // Role chosen at login gates which features are visible. The owner account
        // always signs in as admin regardless of selection.
        const effectiveRole: string =
          user.id === 1
            ? "admin"
            : input.role === "student"
              ? "student"
              : "farmer";
        await db.setDemoSelectedRole(user.id, effectiveRole as any);
        await db.updateUserRole(user.id, effectiveRole);
        const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "KrishAI User", expiresInMs: 90 * 24 * 60 * 60 * 1000 });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 90 * 24 * 60 * 60 });
        await db.auditLog(user.id, "demo.login", "auth", `Demo login as ${account.username} role=${effectiveRole}`);
        return { success: true, role: effectiveRole } as const;
      }),
    /** Exposes whether the demo password login is available (true when a demo account exists). */
    demoAvailable: publicProcedure.query(async () => {
      const accounts = await db.countDemoAccounts();
      return { available: accounts > 0 } as const;
    }),
  }),

  // ---------- Profile / onboarding ----------
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return (await db.getProfile(ctx.user.id)) ?? null;
    }),
    update: protectedProcedure
      .input(z.object({
        userType: z.string().optional(),
        fullName: z.string().max(200).optional(),
        email: z.string().max(320).optional(),
        mobile: z.string().optional(),
        language: z.string().optional(),
        state: z.string().optional(),
        district: z.string().optional(),
        village: z.string().optional(),
        pincode: z.string().optional(),
        aboutMe: z.string().optional(),
        // Farmer fields
        farmingExperienceYears: z.number().int().optional(),
        farmOwnerStatus: z.string().optional(),
        soilType: z.string().optional(),
        rainfallType: z.string().optional(),
        growingSeason: z.string().optional(),
        irrigationAccess: z.string().optional(),
        cropsOfInterest: z.array(z.string()).optional(),
        // Student fields
        age: z.number().int().optional(),
        universityName: z.string().max(300).optional(),
        enrollmentYear: z.number().int().optional(),
        degreeLevel: z.string().optional(),
        courseName: z.string().max(300).optional(),
        subjects: z.array(z.string()).optional(),
        researchArea: z.string().max(300).optional(),
        graduationYear: z.number().int().optional(),
        purpose: z.string().optional(),
        // Raw onboarding answers (stored for admin 360 view)
        onboardingAnswers: z.record(z.string(), z.any()).optional(),
        onboardingComplete: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Auto-tag region/climate when location fields change.
        let regionTags: string[] | undefined;
        const prof = await db.getProfile(ctx.user.id);
        if (
          input.state !== undefined || input.district !== undefined ||
          input.rainfallType !== undefined || input.soilType !== undefined
        ) {
          const { deriveRegionTags } = await import("./recommendations");
          regionTags = deriveRegionTags({
            state: input.state ?? prof?.state,
            district: input.district ?? prof?.district,
            rainfallType: input.rainfallType ?? prof?.rainfallType,
            soilType: input.soilType ?? prof?.soilType,
          });
        }
        return db.upsertProfile(ctx.user.id, { ...input, regionTags: regionTags ?? undefined });
      }),
    locations: publicProcedure.input(z.object({ state: z.string() })).query(({ input }) => {
      const s = INDIA_LOCATIONS[input.state];
      return s ? { lat: s.lat, lon: s.lon, districts: s.districts } : null;
    }),
    states: publicProcedure.query(() => Object.keys(INDIA_LOCATIONS)),
  }),

  // ---------- Dashboard ----------
  dashboard: router({
    widgets: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const [profile, farms, notifs] = await Promise.all([
        db.getProfile(userId),
        db.listFarms(userId),
        db.listNotifications(userId).then((n) => n.slice(0, 10)),
      ]);

      let weather = null;
      if (profile?.state) {
        const loc = INDIA_LOCATIONS[profile.state];
        if (loc) {
          weather = await getWeather({
            lat: loc.lat, lon: loc.lon,
            state: profile.state, district: profile.district ?? "District", village: profile.village ?? undefined,
          }).catch(() => null);
        }
      }

      const cropsAll: { farmName: string; crop: NonNullable<Awaited<ReturnType<typeof db.listCrops>>>[number] }[] = [];
      for (const f of farms.slice(0, 5)) {
        const cs = await db.listCrops(userId, f.id);
        for (const c of cs.slice(0, 1)) cropsAll.push({ farmName: f.name, crop: c });
      }

      const today = await todayRecommendation(userId);

      const mkey = "market:Rice:Maharashtra";
      const cachedMarket = await db.getCachedMarket(mkey);
      const marketPreview = cachedMarket?.data ?? null;

      return { profile, farms, crops: cropsAll, weather, today, notifications: notifs, marketPreview };
    }),
    todayRecommendation: protectedProcedure.query(async ({ ctx }) => todayRecommendation(ctx.user.id)),
  }),

  // ---------- Farms ----------
  farms: router({
    list: protectedProcedure.query(async ({ ctx }) => db.listFarms(ctx.user.id)),
    get: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .query(async ({ ctx, input }) => {
        const f = await db.getFarm(ctx.user.id, input.farmId);
        if (!f) throw new TRPCError({ code: "NOT_FOUND", message: "Farm not found" });
        return f;
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(200),
        state: z.string().optional(),
        district: z.string().optional(),
        village: z.string().optional(),
        farmSize: z.string().optional(),
        soilType: z.string().optional(),
        irrigation: z.string().optional(),
        farmingMethod: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const f = await db.createFarm(ctx.user.id, input);
        await db.logAudit(ctx.user.id, "farm.create", `farm:${f?.id}`, input.name);
        return f;
      }),
    update: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        name: z.string().optional(),
        state: z.string().optional(),
        district: z.string().optional(),
        village: z.string().optional(),
        farmSize: z.string().optional(),
        soilType: z.string().optional(),
        irrigation: z.string().optional(),
        farmingMethod: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { farmId, ...data } = input;
        await db.updateFarm(ctx.user.id, farmId, data);
        await db.logAudit(ctx.user.id, "farm.update", `farm:${farmId}`);
        return db.getFarm(ctx.user.id, farmId);
      }),
    delete: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteFarm(ctx.user.id, input.farmId);
        await db.logAudit(ctx.user.id, "farm.delete", `farm:${input.farmId}`);
        return { success: true };
      }),
  }),

  // ---------- Crops / lifecycle ----------
  crops: router({
    list: protectedProcedure.input(z.object({ farmId: z.number() })).query(async ({ ctx, input }) => db.listCrops(ctx.user.id, input.farmId)),
    create: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        name: z.string().min(1),
        variety: z.string().optional(),
        stage: z.string().optional(),
        plantedAt: z.date().optional(),
        expectedHarvestAt: z.date().optional(),
        area: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const c = await db.createCrop(ctx.user.id, input.farmId, input);
        await db.logAudit(ctx.user.id, "crop.create", `crop:${c?.id}`, input.name);
        return c;
      }),
    updateStage: protectedProcedure
      .input(z.object({
        cropId: z.number(),
        farmId: z.number(),
        stage: z.enum(["land_preparation", "sowing", "germination", "vegetative", "flowering", "fruiting", "maturity", "harvest", "post_harvest"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const c = await db.updateCrop(ctx.user.id, input.cropId, input.farmId, { stage: input.stage, notes: input.notes });
        await db.logAudit(ctx.user.id, "crop.stage", `crop:${input.cropId}`, input.stage);
        return c;
      }),
    update: protectedProcedure
      .input(z.object({
        cropId: z.number(),
        farmId: z.number(),
        variety: z.string().optional(),
        area: z.string().optional(),
        expectedHarvestAt: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { cropId, farmId, ...data } = input;
        return db.updateCrop(ctx.user.id, cropId, farmId, data);
      }),
    delete: protectedProcedure
      .input(z.object({ cropId: z.number(), farmId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCrop(ctx.user.id, input.cropId, input.farmId);
        return { success: true };
      }),
    stageGuidance: protectedProcedure
      .input(z.object({ cropId: z.number(), farmId: z.number() }))
      .query(async ({ ctx, input }) => {
        const crop = await db.updateCrop(ctx.user.id, input.cropId, input.farmId, {});
        if (!crop) throw new TRPCError({ code: "NOT_FOUND" });
        const knowledge = await advisorKnowledgeContext(`${crop.name} ${crop.stage}`, crop.name);
        const answer = await askAdvisor({
          question: `Explain the current growth stage "${(crop.stage ?? "").replace(/_/g, " ")}" of ${crop.name} and give stage-specific care recommendations with the reasoning behind each one.`,
          history: [],
          context: knowledge ? { knowledge } : undefined,
        }).catch(() => null as unknown as AdvisorReply);
        return {
          crop,
          guidance: answer ? { answer: answer.answer, sources: answer.sources, disclaimer: answer.disclaimer, sourceLabels: answer.sourceLabels } : null,
        };
      }),
  }),

  // ---------- Weather ----------
  weather: router({
    get: protectedProcedure
      .input(z.object({
        state: z.string(),
        district: z.string().optional(),
        village: z.string().optional(),
        lat: z.number().optional(),
        lon: z.number().optional(),
        forceLive: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        const loc = INDIA_LOCATIONS[input.state];
        const lat = input.lat ?? loc?.lat ?? 26.8467;
        const lon = input.lon ?? loc?.lon ?? 80.9462;
        return getWeather({
          lat, lon, state: input.state,
          district: input.district ?? loc?.name ?? "District",
          village: input.village, forceLive: input.forceLive,
        });
      }),
  }),

  // ---------- Market ----------
  market: router({
    prices: protectedProcedure
      .input(z.object({ commodity: z.string().optional(), state: z.string().optional(), forceLive: z.boolean().optional() }))
      .query(async ({ input }) => getMarketPrices(input)),
    commodities: protectedProcedure.query(async () => {
      return ["Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Soyabean", "Groundnut", "Mustard", "Tomato", "Onion", "Potato", "Chana", "Tur (Arhar)", "Jowar", "Bajra", "Mango", "Banana", "Chillies", "Gram", "Urad"];
    }),
  }),

  // ---------- Disease scan (vision) ----------
  disease: router({
    analyze: protectedProcedure
      .input(z.object({
        images: z.array(z.string()).min(1).max(6),
        crop: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const urls: string[] = [];
        for (const img of input.images) {
          const { bytes, mime } = allowedBase64(img);
          const { url } = await storagePut(`disease/${ctx.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${mime === "image/png" ? "png" : "jpg"}`, bytes, mime);
          urls.push(url);
        }
        await db.createUploadedFile(ctx.user.id, { category: "disease-scan", url: urls[0]!, fileKey: `disease/${ctx.user.id}`, mimeType: urls.length ? "image/jpeg" : undefined });

        const result = await analyzePlantImages(urls, input.crop);
        const saved = await db.createDiseaseAnalysis(ctx.user.id, {
          crop: input.crop,
          result: result,
          confidence: result.confidence,
          images: urls,
        });
        await db.logAudit(ctx.user.id, "disease.analyze", `analysis:${saved?.id}`, input.crop ?? "unknown");
        return { analysis: saved, result };
      }),
    history: protectedProcedure.query(async ({ ctx }) => db.listDiseaseAnalyses(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const a = await db.getDiseaseAnalysis(ctx.user.id, input.id);
      if (!a) throw new TRPCError({ code: "NOT_FOUND", message: "Scan report not found" });
      return a;
    }),
    saveReport: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const a = await db.getDiseaseAnalysis(ctx.user.id, input.id);
        if (!a) throw new TRPCError({ code: "NOT_FOUND" });
        const res = a.result as any;
        const symptoms = Array.isArray(res?.symptoms) ? res.symptoms.map(String) : [];
        const alternatives = Array.isArray(res?.alternatives) ? res.alternatives.map(String) : [];
        const nextSteps = Array.isArray(res?.nextSteps) ? res.nextSteps.map(String) : [];
        const body = [
          `## Scan report: ${a.crop ?? "Unknown crop"}`,
          `**Finding:** ${res?.issue ?? "Unknown"}`,
          `**Confidence:** ${res?.confidence ?? 0}%`,
          `**Symptoms observed:** ${symptoms.join("; ") || "none recorded"}`,
          `**Possible alternatives:** ${alternatives.join("; ") || "none"}`,
          `**Severity (visual estimate):** ${res?.severity ?? "unknown"}`,
          `**Uncertainty:** ${res?.uncertaintyDisclosure ?? "Visual estimate only"}`,
          `**Next steps:** ${nextSteps.join("; ")}`,
        ].join("\n\n");
        const report = await db.createReport(ctx.user.id, { type: "disease", title: `Disease scan: ${a.crop ?? "Unknown"} — ${res?.issue ?? "Unknown"}`, body, aiGenerated: false });
        return report;
      }),
  }),

  // ---------- AI advisor ----------
  advisor: router({
    conversations: protectedProcedure.query(async ({ ctx }) => db.listConversations(ctx.user.id)),
    messages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const msgs = await db.getMessages(input.conversationId, ctx.user.id);
        return msgs.map((m) => ({ ...m, content: typeof m.content === "string" ? m.content : "" }));
      }),
    ask: protectedProcedure
      .input(z.object({
        conversationId: z.number().optional(),
        question: z.string().min(1).max(4000),
        contextOpts: z.object({
          includeWeather: z.boolean().optional(),
          includeMarket: z.boolean().optional(),
          includeFarm: z.boolean().optional(),
          customContext: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let convId = input.conversationId;
        if (!convId) {
          const c = await db.createConversation(ctx.user.id, input.question.slice(0, 80));
          convId = c!.id;
        } else {
          const exists = await db.getConversation(ctx.user.id, convId);
          if (!exists) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        }

        const history = await db.getMessages(convId, ctx.user.id);
        await db.addMessage(convId, ctx.user.id, "user", input.question);
        void history;

        // Build live context if requested
        const profile = await db.getProfile(ctx.user.id);
        const weatherCtx: string[] = [];
        
        // Auto-inject region tags if present
        if (profile?.regionTags && Array.isArray(profile.regionTags)) {
          weatherCtx.push(`User Region Context: ${profile.regionTags.join(", ")}`);
        }
        
        if (input.contextOpts?.customContext) {
          weatherCtx.push(input.contextOpts.customContext);
        }
        if (input.contextOpts?.includeWeather && profile?.state) {
          const loc = INDIA_LOCATIONS[profile.state];
          if (loc) {
            try {
              const w = await getWeather({ lat: loc.lat, lon: loc.lon, state: profile.state, district: profile.district ?? "District", village: profile.village ?? undefined });
              weatherCtx.push(`Weather (${w.freshness}, ${w.provider}): ${w.current.temperature}°C ${w.current.description}, humidity ${w.current.humidity}%, rain prob ${w.current.rainProbability}%. Agri: ${w.agri.irrigationAdvice}`);
            } catch { weatherCtx.push("Weather data currently unavailable."); }
          }
        }
        const marketCtx: string[] = [];
        if (input.contextOpts?.includeMarket) {
          try {
            const m = await getMarketPrices({});
            if (m.rows.length) marketCtx.push(m.rows.slice(0, 15).map((r) => `${r.commodity} (${r.variety}) @ ${r.market}, ${r.district}: modal ₹${r.modalPrice}/quintal (${r.arrivalDate})`).join("\n"));
          } catch { marketCtx.push("Market data currently unavailable."); }
        }

        const knowledge = await advisorKnowledgeContext(input.question).catch(() => undefined);

        const answer = await askAdvisor({
          question: input.question,
          history: history.map((m) => ({ role: m.role, content: "" })),
          context: {
            weather: weatherCtx.join("\n") || undefined,
            market: marketCtx.join("\n") || undefined,
            farm: profile ? `${profile.userType ?? "farmer"} in ${[profile.village ?? null, profile.district ?? null, profile.state ?? null].filter(Boolean).join(", ")}` : undefined,
            knowledge,
          },
        });

        await db.addMessage(convId, ctx.user.id, "assistant", answer.answer, answer.sources);
        await db.logAudit(ctx.user.id, "advisor.ask", `conversation:${convId}`);
        return { conversationId: convId, reply: answer };
      }),
  }),

  // ---------- Crop recommendations ----------
  recommend: router({
    crops: protectedProcedure
      .input(z.object({
        soilType: z.string().optional(),
        irrigation: z.string().optional(),
        season: z.string().optional(),
        preference: z.string().optional(),
      }).optional())
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getProfile(ctx.user.id);
        const result = await recommendCrops({
          state: profile?.state ?? undefined,
          district: profile?.district ?? undefined,
          soilType: input?.soilType,
          irrigation: input?.irrigation,
          season: input?.season,
          preference: input?.preference,
        });
        return result;
      }),
  }),

  // ---------- Products ----------
  products: router({
    search: protectedProcedure
      .input(z.object({ query: z.string().optional(), category: z.string().optional() }))
      .query(async ({ input }) => db.searchProducts(input.query, input.category)),
  }),

  // ---------- Research portal ----------
  research: router({
    papers: protectedProcedure.query(async ({ ctx }) => db.listSavedPapers(ctx.user.id)),
    save: protectedProcedure
      .input(z.object({ title: z.string().min(1), url: z.string().optional(), doi: z.string().optional(), note: z.string().optional() }))
      .mutation(async ({ ctx, input }) => db.savePaper(ctx.user.id, input)),
    remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteSavedPaper(ctx.user.id, input.id);
      return { success: true };
    }),
    summarize: protectedProcedure
      .input(z.object({ title: z.string().min(1), abstract: z.string().optional(), text: z.string().optional() }))
      .mutation(async ({ input }) => summarizePaper({ title: input.title, abstract: input.abstract, fullText: input.text })),
    knowledgeSearch: protectedProcedure
      .input(z.object({ query: z.string().min(2) }))
      .query(async ({ input }) => db.searchKnowledge(input.query)),
  }),

  // ---------- Reports ----------
  reports: router({
    list: protectedProcedure.query(async ({ ctx }) => db.listReports(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const r = await db.getReport(ctx.user.id, input.id);
      if (!r) throw new TRPCError({ code: "NOT_FOUND" });
      return r;
    }),
    generate: protectedProcedure
      .input(z.object({
        type: z.enum(["crop", "disease", "farm", "weather", "market", "research"]),
        title: z.string().min(1).max(300),
        subject: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getProfile(ctx.user.id);
        const farms = await db.listFarms(ctx.user.id);
        let context = `User: ${profile?.userType ?? "farmer"} in ${[profile?.village, profile?.district, profile?.state].filter(Boolean).join(", ") || "location unknown"}.\n`;
        if (input.subject) context += `\nSubject detail: ${input.subject}\n`;
        if (input.type === "farm" || input.type === "crop") {
          context += `\nFarms:\n${farms.map((f) => `- ${f.name} (${f.farmSize ?? "?"}) in ${[f.village, f.district, f.state].filter(Boolean).join(", ")}, soil: ${f.soilType ?? "unknown"}`).join("\n")}`;
        }
        if (input.type === "weather" && profile?.state) {
          try {
            const loc = INDIA_LOCATIONS[profile.state];
            if (loc) {
              const w = await getWeather({ lat: loc.lat, lon: loc.lon, state: profile.state, district: profile.district ?? "District" });
              context += `\nLive weather: ${w.current.temperature}°C ${w.current.description}, humidity ${w.current.humidity}%, 7-day forecast provided by ${w.provider} (${w.freshness}).`;
            }
          } catch { context += "\nLive weather unavailable at report time.\n"; }
        }
        if (input.type === "market") {
          try {
            const m = await getMarketPrices({});
            context += `\nLive market snapshot (${m.freshness}): ${m.rows.slice(0, 20).map((r) => `${r.commodity} ₹${r.modalPrice}/q @ ${r.market}`).join("; ")}`;
          } catch { context += "\nLive market data unavailable at report time.\n"; }
        }
        const raw = await generateReport({ type: input.type, title: input.title, context });
        const body = typeof raw === "string" ? raw : "";
        const report = await db.createReport(ctx.user.id, { type: input.type, title: input.title, body, aiGenerated: true });
        await db.logAudit(ctx.user.id, "report.generate", `report:${report?.id}`, input.type);
        return report;
      }),
    remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteReport(ctx.user.id, input.id);
      return { success: true };
    }),
  }),

  // ---------- Files ----------
  files: router({
    list: protectedProcedure.query(async ({ ctx }) => db.listUploadedFiles(ctx.user.id)),
    upload: protectedProcedure
      .input(z.object({ dataUrl: z.string(), category: z.string().optional(), farmId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { bytes, mime } = allowedBase64(input.dataUrl);
        const key = `uploads/${ctx.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const { url } = await storagePut(key, bytes, mime);
        const file = await db.createUploadedFile(ctx.user.id, {
          farmId: input.farmId,
          category: input.category ?? "general",
          url, fileKey: key, mimeType: mime, size: bytes.length,
        });
        return file;
      }),
  }),

  // ---------- Notifications ----------
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => db.listNotifications(ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.markNotificationRead(ctx.user.id, input.id);
      return { success: true };
    }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
    notify: protectedProcedure
      .input(z.object({ title: z.string().min(1).max(300), body: z.string().optional(), category: z.string().optional() }))
      .mutation(async ({ ctx, input }) => db.createNotification(ctx.user.id, input)),
  }),

  // ---------- Admin (dedicated SaaS backoffice — UI lives in /admin) ----------
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
