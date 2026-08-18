/**
 * AI agriculture orchestration:
 * - Advisor chat with tool-calling and LIVE/CACHED/INFERRED source labels
 * - Vision disease analysis with confidence + uncertainty disclosure
 * - Crop recommendation with explainable reasons
 */
import { invokeLLM } from "../_core/llm";
import { searchKnowledge } from "../db";
import { getSeason } from "./weather";

const JSON_SCHEMA_ADVISOR = {
  type: "json_schema" as const,
  json_schema: {
    name: "advisor_reply",
    strict: true,
    schema: {
      type: "object",
      properties: {
        answer: { type: "string", description: "The advisor's answer in clear, simple language. May use markdown." },
        sourceLabels: {
          type: "array",
          items: { type: "string", enum: ["LIVE", "CACHED", "INFERRED"] },
          description: "How each factual claim in the answer was derived",
        },
        sources: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string", enum: ["LIVE", "CACHED", "INFERRED"] },
              text: { type: "string" },
            },
            required: ["label", "text"],
            additionalProperties: false,
          },
          description: "Attribution for the answer's claims",
        },
        disclaimer: {
          type: "string",
          description: "One-sentence safety disclaimer, e.g. advisory should be verified with local agricultural experts",
        },
      },
      required: ["answer", "sourceLabels", "sources", "disclaimer"],
      additionalProperties: false,
    },
  },
};

const JSON_SCHEMA_VISION = {
  type: "json_schema" as const,
  json_schema: {
    name: "vision_diagnosis",
    strict: true,
    schema: {
      type: "object",
      properties: {
        detectedCrop: { type: "string", description: "Crop or plant identified, or 'Unknown'" },
        issue: { type: "string", description: "Likely disease or health issue, or 'Healthy / No visible issue'" },
        confidence: { type: "integer", description: "Confidence 0-100" },
        symptoms: {
          type: "array",
          items: { type: "string" },
          description: "Visible symptoms observed",
        },
        alternatives: {
          type: "array",
          items: { type: "string" },
          description: "Alternative possible issues",
        },
        severity: { type: "string", enum: ["low", "moderate", "high", "unknown"], description: "Estimated severity from visual evidence only" },
        nextSteps: {
          type: "array",
          items: { type: "string" },
          description: "Recommended next steps at a high level",
        },
        uncertaintyDisclosure: {
          type: "string",
          description: "Plain-language statement of what the model cannot determine from images alone",
        },
        consultExpert: { type: "boolean", description: "Whether to recommend consulting a local agricultural expert" },
      },
      required: ["detectedCrop", "issue", "confidence", "symptoms", "alternatives", "severity", "nextSteps", "uncertaintyDisclosure", "consultExpert"],
      additionalProperties: false,
    },
  },
};

const VISION_SYSTEM_PROMPT = `You are an agricultural vision analyst for KrishAI Hub. The user will send one or more plant/crop photos.
Analyze ONLY what is visually visible. Identify the crop if recognizable. Describe visible symptoms (spots, discoloration, wilting, holes, mold).
Give a likely diagnosis as "Likely ..." with a confidence integer 0-100. If confidence is below 60, state clearly that identification is uncertain.
NEVER claim definitive diagnosis. List alternative possibilities. Severity must be based on visual evidence only.
Recommend high-level next steps (e.g., "upload a leaf underside image", "consult local agriculture officer").
uncertaintyDisclosure must explain limits: visual estimates are not laboratory results; confirmation requires expert inspection or lab tests.
Always set consultExpert true if confidence < 70 or severity high.
Respond only with valid JSON matching the schema.`;

export interface VisionResult {
  detectedCrop: string;
  issue: string;
  confidence: number;
  symptoms: string[];
  alternatives: string[];
  severity: "low" | "moderate" | "high" | "unknown";
  nextSteps: string[];
  uncertaintyDisclosure: string;
  consultExpert: boolean;
}

export async function analyzePlantImages(imageUrls: string[], cropHint?: string): Promise<VisionResult> {
  const content: any[] = [
    { type: "text" as const, text: cropHint ? `The farmer reports this is a ${cropHint} plant.` : "Identify the crop and any visible health issues." },
  ];
  for (const url of imageUrls) {
    content.push({ type: "image_url" as const, image_url: { url } });
  }
  const res = await invokeLLM({
    messages: [
      { role: "system", content: VISION_SYSTEM_PROMPT },
      { role: "user", content },
    ],
    response_format: JSON_SCHEMA_VISION,
  });
  const raw = res.choices?.[0]?.message?.content;
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return {
    detectedCrop: parsed.detectedCrop ?? "Unknown",
    issue: parsed.issue ?? "Unable to determine",
    confidence: Math.min(100, Math.max(0, Number(parsed.confidence ?? 0))),
    symptoms: parsed.symptoms ?? [],
    alternatives: parsed.alternatives ?? [],
    severity: parsed.severity ?? "unknown",
    nextSteps: parsed.nextSteps ?? [],
    uncertaintyDisclosure: parsed.uncertaintyDisclosure ?? "This is a visual estimate, not a laboratory result. Confirm with a local agricultural expert.",
    consultExpert: Boolean(parsed.consultExpert),
  };
}

const ADVISOR_SYSTEM_PROMPT = `You are KrishAI, the AI agriculture advisor of KrishAI Hub, serving Indian farmers, students and researchers.
You answer questions about crops, farming practices, weather interpretation, market context, and agricultural research.
CRITICAL RULES:
- REAL DATA > AI GUESSING. Never invent prices, weather values, disease diagnoses, regulations, government schemes, or citations.
- The user's message may include [CONTEXT] blocks with real retrieved data (weather, market, knowledge). Base factual claims on those.
- If reliable data is not provided in context, say "I don't have reliable current data for this" instead of inventing.
- Use probabilistic, range-based language. Never say "guaranteed profit" or "guaranteed yield".
- For chemical/product guidance: remind about label compliance, local regulations, and consulting agriculture officers. Never invent dosages.
- Include a short safety disclaimer in the disclaimer field.
- Answer in clear simple language suitable for farmers, unless the user is a researcher asking a technical question.
- You may use concise markdown in answer. Keep answer under 400 words.`;

export interface AdvisorReply {
  answer: string;
  sourceLabels: string[];
  sources: { label: string; text: string }[];
  disclaimer: string;
}

export async function askAdvisor(opts: {
  question: string;
  history: { role: "user" | "assistant"; content: string }[];
  context?: { weather?: string; market?: string; farm?: string; knowledge?: string };
}): Promise<AdvisorReply> {
  const ctxParts: string[] = [];
  if (opts.context?.weather) ctxParts.push(`[CONTEXT: WEATHER DATA — REAL API DATA]\n${opts.context.weather}`);
  if (opts.context?.market) ctxParts.push(`[CONTEXT: MARKET DATA — REAL API DATA]\n${opts.context.market}`);
  if (opts.context?.farm) ctxParts.push(`[CONTEXT: FARM PROFILE]\n${opts.context.farm}`);
  if (opts.context?.knowledge) ctxParts.push(`[CONTEXT: AGRICULTURAL KNOWLEDGE — VERIFIED PUBLICATIONS]\n${opts.context.knowledge}`);

  const contextBlock = ctxParts.length
    ? "The following real retrieved data is available for grounding your answer:\n\n" + ctxParts.join("\n\n")
    : "No live data context was retrieved. Do not invent data — if the question needs live data you don't have, say you lack reliable current data and give general guidance.";

  const messages: any[] = [
    { role: "system", content: ADVISOR_SYSTEM_PROMPT + "\n\n" + contextBlock },
  ];
  for (const m of opts.history.slice(-10)) {
    messages.push({ role: m.role, content: m.content });
  }
  messages.push({ role: "user", content: opts.question });

  const res = await invokeLLM({ messages, response_format: JSON_SCHEMA_ADVISOR });
  const raw = res.choices?.[0]?.message?.content;
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return {
    answer: parsed.answer ?? "",
    sourceLabels: parsed.sourceLabels ?? [],
    sources: parsed.sources ?? [],
    disclaimer: parsed.disclaimer ?? "AI agricultural guidance is informational; verify with local agricultural experts for high-risk decisions.",
  };
}

const CROP_PROFILES_PUBLIC = `Common crops and their reference profiles (agronomic reference data): Rice (kharif, high water, clay loam, 110-150 days, 2.5-6 t/ha), Wheat (rabi, medium water, loam, 100-130 days, 3-5.5 t/ha), Cotton (kharif, black cotton soil, 150-180 days), Sugarcane (long duration, high water, 280-365 days), Maize (kharif, 90-120 days), Soybean (kharif, central India, 90-110 days), Groundnut (kharif, sandy loam, low water), Mustard (rabi, low water), Tomato (all-season), Onion (rabi), Potato (rabi), Chickpea (rabi, low water), Tur/Pigeonpea (kharif, low water), Jowar (kharif, low water), Bajra (kharif, arid zones, low water), Mango (perennial), Banana (perennial, high water), Chilli (kharif).`;

const JSON_SCHEMA_RECOMMEND = {
  type: "json_schema" as const,
  json_schema: {
    name: "crop_recommendation",
    strict: true,
    schema: {
      type: "object",
      properties: {
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              crop: { type: "string" },
              suitabilityScore: { type: "integer", description: "0-100" },
              climateSuitability: { type: "string" },
              seasonFit: { type: "string" },
              waterFit: { type: "string" },
              growingPeriodDays: { type: "string" },
              risks: { type: "array", items: { type: "string" } },
              estimateCost: { type: "string" },
              yieldRange: { type: "string" },
              reason: { type: "string" },
            },
            required: ["crop", "suitabilityScore", "climateSuitability", "seasonFit", "waterFit", "growingPeriodDays", "risks", "estimateCost", "yieldRange", "reason"],
            additionalProperties: false,
          },
        },
        disclaimer: { type: "string" },
      },
      required: ["recommendations", "disclaimer"],
      additionalProperties: false,
    },
  },
};

export async function recommendCrops(opts: {
  state?: string;
  district?: string;
  soilType?: string;
  irrigation?: string;
  season?: string;
  preference?: string;
}): Promise<{ recommendations: any[]; disclaimer: string }> {
  const season = opts.season ?? getSeason();
  const prompt = [
    `Recommend crops for a farm in ${opts.state ?? "India"}${opts.district ? `, ${opts.district}` : ""}.`,
    `Soil: ${opts.soilType ?? "unknown"}. Irrigation: ${opts.irrigation ?? "unknown"}.`,
    `Current season: ${season}. Farmer preference: ${opts.preference ?? "none specified"}.`,
    CROP_PROFILES_PUBLIC,
    "Use these reference profiles plus general agronomy. Score suitability 0-100 combining season fit, soil fit, water availability, and typical regional practice. Provide 3-5 crops sorted by score. Costs are indicative ranges only — label them 'indicative estimate'. Use range-based yields. Never guarantee profit or yield. Include known regional disease/climate risks per crop.",
  ].join("\n");

  const res = await invokeLLM({
    messages: [
      { role: "system", content: "You are an agronomist for KrishAI Hub. Output JSON only per schema. Never fabricate region-specific data you do not know — use general agronomic reference facts." },
      { role: "user", content: prompt },
    ],
    response_format: JSON_SCHEMA_RECOMMEND,
  });
  const raw = res.choices?.[0]?.message?.content;
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return {
    recommendations: parsed.recommendations ?? [],
    disclaimer: parsed.disclaimer ?? "Recommendations are indicative estimates from agronomic reference data, not guarantees. Verify locally before investing.",
  };
}

export async function generateReport(opts: { type: string; title: string; context: string }) {
  const res = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are KrishAI report writer. Produce a structured report in markdown with sections: Executive Summary, Data & Analysis, Recommendations, Risks, Sources, AI-Generated Disclosure. Base every factual claim ONLY on the provided context. If context lacks data, say 'Data unavailable' rather than inventing figures. Never guarantee outcomes.",
      },
      { role: "user", content: `Write a ${opts.type} report titled "${opts.title}".\n\n[CONTEXT]\n${opts.context}` },
    ],
  });
  return res.choices?.[0]?.message?.content ?? "";
}

export async function summarizePaper(opts: { title: string; abstract?: string; fullText?: string }) {
  const body = opts.fullText && opts.fullText.length > 8000 ? opts.fullText.slice(0, 8000) + "\n...(truncated)" : (opts.fullText ?? opts.abstract ?? "");
  const res = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a research assistant for KrishAI Hub's Research Portal. Summarize the given paper faithfully. Do not invent citations, data, or findings not present in the text. If text is insufficient, say what is missing.",
      },
      { role: "user", content: `Paper: "${opts.title}"\n\n${body}` },
    ],
  });
  return res.choices?.[0]?.message?.content ?? "";
}

/** Build knowledge context for advisor from RAG corpus. */
export async function advisorKnowledgeContext(query: string, cropHint?: string) {
  const docs = await searchKnowledge(query, cropHint ? { crop: cropHint } : undefined);
  if (docs.length === 0) return undefined;
  return docs
    .map(
      (d: any) =>
        `-- ${d.title} (source: ${d.source ?? "public publication"})\n${(d.body ?? "").slice(0, 900)}`,
    )
    .join("\n\n");
}
