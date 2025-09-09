// app/api/resources/suggest/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const API_KEY = process.env.OPENAI_API_KEY!;

// ---- Zod request/response schemas ----
const RequestSchema = z.object({
  subject: z.string().min(1),
  skillSlug: z.string().min(1),
  skillTitle: z.string().min(1),
  level: z.string().min(1),         // "y6"
  age: z.number().int().min(4).max(18),
  objectives: z.array(z.string()).optional(),
  have: z.object({
    tips: z.number().int().min(0).optional(),
    activities: z.number().int().min(0).optional(),
    reading: z.number().int().min(0).optional(),
    extension: z.number().int().min(0).optional(),
  }).optional(),
  // Optional language flavour (for future language pages)
  langName: z.string().optional(),  // e.g. "German"
  langCode: z.string().optional(),  // e.g. "de"
});

const ResponseSchema = z.object({
  tips: z.array(z.string()).max(6),
  activities: z.array(
    z.object({
      title: z.string(),
      steps: z.array(z.string()).min(1).max(6),
    })
  ).max(4),
  readingWatching: z.array(
    z.object({
      label: z.string(),
      note: z.string().optional(),
    })
  ).max(5),
  extension: z.array(z.string()).max(4),
});

// ---- Simple safety & cleaning helpers ----
const URL_RE = /\bhttps?:\/\/\S+|\bwww\.\S+/gi;
const UNSAFE_WORDS = [
  "knife","knives","scalpel","bleach","acid","acids","alkali","chemical",
  "solder","soldering","saw","hammer","drill","lighter","matches","flame",
  "stove","hob","oven","boil","boiling oil","toxic","flammable",
];

function stripLinks(s: string) {
  return s.replace(URL_RE, "").replace(/\s{2,}/g, " ").trim();
}
function looksUnsafe(s: string) {
  const lo = s.toLowerCase();
  return UNSAFE_WORDS.some(w => lo.includes(w));
}
function dedupeStrings(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const key = it.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it.trim());
  }
  return out;
}
function dedupeLabels<T extends { label: string }>(items: T[]) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const key = it.label.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...it, label: it.label.trim() });
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500 });
    }

    const json = await req.json();
    const parsed = RequestSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Bad request", details: parsed.error.flatten() }), { status: 400 });
    }

    const {
      subject, skillTitle, level, age,
      objectives = [],
      have,
      langName,
    } = parsed.data;

    // How many new items to request (top-up to target ranges)
    const target = { tips: 4, activities: 3, reading: 4, extension: 3 };
    const need = {
      tips: Math.max(0, target.tips - (have?.tips ?? 0)),
      activities: Math.max(0, target.activities - (have?.activities ?? 0)),
      reading: Math.max(0, target.reading - (have?.reading ?? 0)),
      extension: Math.max(0, target.extension - (have?.extension ?? 0)),
    };

    // System + user prompts with guardrails
    const languageLines =
      subject.startsWith("Languages") && langName
        ? [
            `When relevant, you may include one cultural note for ${langName} (keep it neutral and age-appropriate).`,
            `Keep any example phrases simple; English glosses are allowed in parentheses.`,
          ].join("\n")
        : "";

    const sys = [
      `You are a UK primary tutor generating enrichment ideas for: ${subject} → ${skillTitle} (Year ${level.replace(/^y/i,"")}, age ~${age}).`,
      `Tone: encouraging, simple, non-jargony. No assessment or tests.`,
      `Constraints: low-cost, household materials only. No tools/heat/chemicals/sharp objects. Include safety cues if outdoor.`,
      `Output MUST be JSON only with the exact keys: tips, activities, readingWatching, extension.`,
      `Do NOT include URLs but do include specific names of books, shows or videos if applicable and age appropriate. Use generic labels like "Bitesize-style video about …" for readingWatching.`,
      languageLines,
      objectives.length ? `Learning objectives: ${objectives.join(" | ")}` : ``,
    ].filter(Boolean).join("\n");

    const user = [
      `Create practical enrichment suggestions for the topic.`,
      `Top-up counts (max):`,
      `- tips: up to ${need.tips}`,
      `- activities: up to ${need.activities}`,
      `- readingWatching: up to ${need.reading}`,
      `- extension: up to ${need.extension}`,
      `Keep items short (1–3 lines).`,
      `JSON schema:`,
      JSON.stringify({
        type: "object",
        required: ["tips","activities","readingWatching","extension"],
        properties: {
          tips: { type: "array", items: { type: "string" } },
          activities: {
            type: "array",
            items: {
              type: "object",
              required: ["title","steps"],
              properties: {
                title: { type: "string" },
                steps: { type: "array", items: { type: "string" } }
              }
            }
          },
          readingWatching: {
            type: "array",
            items: {
              type: "object",
              required: ["label"],
              properties: {
                label: { type: "string" },
                note: { type: "string" }
              }
            }
          },
          extension: { type: "array", items: { type: "string" } }
        }
      })
    ].join("\n");

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.5,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("[resources] upstream error:", resp.status, t);
      return new Response(JSON.stringify({ error: "Upstream error" }), { status: 502 });
    }

    const data = await resp.json();
    let content = {};
    try {
      content = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
    } catch {
      content = {};
    }

    // Validate & clean
    const safe = ResponseSchema.safeParse(content);
    if (!safe.success) {
      return new Response(JSON.stringify({ tips: [], activities: [], readingWatching: [], extension: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Post-clean: strip links, remove unsafe, hard-cap counts, dedupe
    const tips = dedupeStrings(
      safe.data.tips
        .map(stripLinks)
        .filter(Boolean)
        .filter((t) => !looksUnsafe(t))
    ).slice(0, 6);

    const activities = safe.data.activities
      .map(a => ({
        title: stripLinks(a.title),
        steps: a.steps.map(stripLinks).filter(Boolean).slice(0, 5),
      }))
      .filter(a => a.title && a.steps.length > 0)
      .filter(a => !looksUnsafe(a.title) && !a.steps.some(looksUnsafe))
      .slice(0, 4);

    const readingWatching = dedupeLabels(
      safe.data.readingWatching
        .map(r => ({ label: stripLinks(r.label), note: r.note ? stripLinks(r.note) : undefined }))
        .filter(r => r.label && !looksUnsafe(r.label))
    ).slice(0, 5);

    const extension = dedupeStrings(
      safe.data.extension
        .map(stripLinks)
        .filter(Boolean)
        .filter((t) => !looksUnsafe(t))
    ).slice(0, 4);

    return new Response(
      JSON.stringify({ tips, activities, readingWatching, extension }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[resources] handler error:", e);
    return new Response(JSON.stringify({ error: "Bad request" }), { status: 400 });
  }
}
