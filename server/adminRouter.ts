import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

const reviewInput = z.object({
  id: z.number(),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().max(1000).optional(),
});

export const adminRouter = router({
  // ---------- Overview ----------
  overview: adminProcedure.query(async ({ ctx }) => {
    const [roles, pending, users, uploads] = await Promise.all([
      db.getRoleCounts(),
      db.countPendingApprovals(),
      db.listUsers(8, 0),
      db.listAllUploads(8),
    ]);
    const [profile, flags] = await Promise.all([
      db.getProfile(ctx.user.id),
      db.getFeatureFlags(),
    ]);
    return {
      roles,
      pendingApprovals: pending,
      recentUsers: users.map((u) => ({
        id: u.id, name: u.name, email: u.email, role: u.role,
        createdAt: u.createdAt, lastSignedIn: u.lastSignedIn,
      })),
      recentUploads: uploads.map((f) => ({
        id: f.id, userId: f.userId, category: f.category, status: f.status,
        createdAt: f.createdAt, size: f.size, url: f.url,
      })),
      adminProfile: profile,
      flags,
    };
  }),

  // ---------- 360 customer view ----------
  user360: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const data = await db.getUser360(input.userId);
      if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return data;
    }),

  // ---------- User governance ----------
  listUsers: adminProcedure
    .input(z.object({ limit: z.number().optional(), offset: z.number().optional(), role: z.string().optional() }).optional())
    .query(async ({ input }) => db.listUsers(input?.limit, input?.offset, input?.role)),

  setRole: adminProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["farmer", "student", "researcher", "professional", "business", "admin", "user"]) }))
    .mutation(async ({ ctx, input }) => {
      await db.updateUserRole(input.userId, input.role);
      await db.auditLog(ctx.user.id, "admin.setRole", `user:${input.userId}`, input.role);
      return { success: true };
    }),

  suspendUser: adminProcedure
    .input(z.object({ userId: z.number(), suspend: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db.updateUserRole(input.userId, input.suspend ? "suspended" : "user");
      await db.auditLog(ctx.user.id, input.suspend ? "admin.suspendUser" : "admin.unsuspendUser", `user:${input.userId}`);
      return { success: true };
    }),

  resetOnboarding: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await db.getProfile(input.userId);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
      await db.upsertProfile(input.userId, { onboardingComplete: false, onboardingAnswers: null });
      await db.auditLog(ctx.user.id, "admin.resetOnboarding", `user:${input.userId}`);
      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteUserAccount(input.userId);
      await db.auditLog(ctx.user.id, "admin.deleteUser", `user:${input.userId}`);
      return { success: true };
    }),

  // ---------- Approvals ----------
  pendingItems: adminProcedure
    .input(z.object({ kind: z.enum(["uploads", "scans", "papers"]) }))
    .query(async ({ input }) => db.listPendingItems(input.kind)),

  reviewUpload: adminProcedure
    .input(reviewInput)
    .mutation(async ({ ctx, input }) => {
      await db.reviewUpload(input.id, input.decision, ctx.user.id, input.note);
      await db.auditLog(ctx.user.id, `admin.reviewUpload.${input.decision}`, `upload:${input.id}`, input.note);
      return { success: true };
    }),

  reviewAnalysis: adminProcedure
    .input(reviewInput)
    .mutation(async ({ ctx, input }) => {
      await db.reviewAnalysis(input.id, input.decision, ctx.user.id, input.note);
      await db.auditLog(ctx.user.id, `admin.reviewAnalysis.${input.decision}`, `analysis:${input.id}`, input.note);
      return { success: true };
    }),

  reviewPaper: adminProcedure
    .input(reviewInput)
    .mutation(async ({ ctx, input }) => {
      await db.reviewPaper(input.id, input.decision, ctx.user.id, input.note);
      await db.auditLog(ctx.user.id, `admin.reviewPaper.${input.decision}`, `paper:${input.id}`, input.note);
      return { success: true };
    }),

  // ---------- Uploaded data manager ----------
  allUploads: adminProcedure
    .input(z.object({ limit: z.number().optional(), offset: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => db.listAllUploads(input?.limit, input?.offset, input?.status)),

  // ---------- Bulk import ----------
  importData: adminProcedure
    .input(z.object({ type: z.enum(["csv", "json"]), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      let rows: Record<string, unknown>[] = [];
      if (input.type === "json") {
        const parsed = JSON.parse(input.content);
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const lines = input.content.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) throw new TRPCError({ code: "BAD_REQUEST", message: "CSV needs a header and at least one row" });
        const headers = lines[0]!.split(",").map((h) => h.trim());
        rows = lines.slice(1).map((line) => {
          const cells = line.split(",").map((c) => c.trim());
          const obj: Record<string, unknown> = {};
          headers.forEach((h, i) => { obj[h] = cells[i] ?? ""; });
          return obj;
        });
      }
      let imported = 0;
      for (const row of rows.slice(0, 500)) {
        const name = String(row.title ?? row.name ?? "");
        if (!name) continue;
        await db.createReport(ctx.user.id, {
          type: "research",
          title: String(row.title ?? name).slice(0, 300),
          body: String(row.body ?? row.description ?? row.summary ?? ""),
          aiGenerated: false,
        });
        imported++;
      }
      await db.auditLog(ctx.user.id, "admin.importData", input.type, `${imported} rows`);
      return { imported };
    }),

  // ---------- Feature flags & governance ----------
  featureFlags: adminProcedure.query(async () => db.getFeatureFlags()),

  setFeatureFlag: adminProcedure
    .input(z.object({ key: z.string().max(100), value: z.union([z.boolean(), z.string()]) }))
    .mutation(async ({ input }) => {
      await db.setFeatureFlag(input.key, input.value);
      return { success: true };
    }),

  // ---------- Settings & audit ----------
  settings: adminProcedure.query(async () => {
    const keys = ["siteTitle", "siteTagline", "maintenanceMode", "aiAdvisorEnabled", "weatherProvider"];
    const out: Record<string, string | null> = {};
    for (const k of keys) out[k] = await db.getSetting(k);
    return out;
  }),

  setSetting: adminProcedure
    .input(z.object({ key: z.string().max(100), value: z.string().max(2000) }))
    .mutation(async ({ ctx, input }) => {
      await db.setSetting(input.key, input.value);
      await db.auditLog(ctx.user.id, "admin.setSetting", input.key);
      return { success: true };
    }),

  auditLogs: adminProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => db.listAuditLogs(input?.limit ?? 200)),

  systemHealth: adminProcedure.query(async () => {
    const [users, audits] = await Promise.all([
      db.getUserCount(),
      db.listAuditLogs(5).then((l) => l.length),
    ]);
    return {
      database: "connected",
      llm: "configured",
      timestamp: new Date().toISOString(),
      stats: { users, auditEntries: audits },
    };
  }),
});
