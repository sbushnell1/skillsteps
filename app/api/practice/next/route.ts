// app/api/practice/next/route.ts
import { NextRequest } from "next/server";
import {
  getObjectivesForSkill,
  chooseForPractice,
  type Objective,
} from "../../../lib/objectives";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const API_KEY = process.env.OPENAI_API_KEY!;

type Settings = {
  total: number;
  difficulty: "warmup" | "standard" | "challenge";
  focusWeaknesses: boolean;
  subject: string;
  subjectSlug: string;
  skillSlug: string;
  skillTitle: string;
  level: string; // "y6"
  age: number;
  objectives: string[];
  weaknesses: string[];      // objectiveIds
  langName?: string;
  langCode?: string;
};

function mapPracticeToObjectiveDifficulty(
  d: Settings["difficulty"]
): "basic" | "intermediate" | "stretch" {
  return d === "warmup" ? "basic" : d === "standard" ? "intermediate" : "stretch";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      mode: "init" | "grade";
      settings: Settings;
      last?: { n: number; question: string; userAnswer: string; objectiveId?: string };
      history: Array<{
        n: number;
        question: string;
        userAnswer: string;
        correct: boolean;
        correctAnswer: string;
        rationale?: string;
        objectiveId?: string; // <-- allow through
      }>;
    };

    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500 });
    }

    const { mode, settings, last, history } = body;

    const remaining =
      settings.total - (history?.length ?? 0) - (mode === "grade" ? 1 : 0);

    const yamlObjectives: Objective[] = await getObjectivesForSkill(
      settings.level,
      settings.subjectSlug,
      settings.skillSlug
    );

    console.log("[practice] settings:", {
      level: settings.level,
      subjectSlug: settings.subjectSlug,
      skillSlug: settings.skillSlug,
      uiDifficulty: settings.difficulty,
      focusWeaknesses: settings.focusWeaknesses,
      incomingWeaknessIds: settings.weaknesses,
    });
    console.log("[practice] yamlObjectives:", { count: yamlObjectives.length });

    const targetDiff = mapPracticeToObjectiveDifficulty(settings.difficulty);

    // bias to supplied weak objectives (ids+tags)
    const weakIds = new Set(settings.weaknesses ?? []);
    const weakObjs = yamlObjectives.filter(o => weakIds.has(o.id));
    const weaknessTitles = weakObjs.map(o => o.title);
    const expandedWeaknessTags =
      settings.focusWeaknesses && weakObjs.length
        ? Array.from(new Set(weakObjs.flatMap(o => [o.id, ...(o.tags ?? [])])))
        : [];

    // avoid repeating already-used objectives in this run
    const usedIdsFromHistory = Array.from(
      new Set((history ?? []).map(h => h.objectiveId).filter(Boolean) as string[])
    );
    if (last?.objectiveId) usedIdsFromHistory.push(last.objectiveId);

    const nextObj =
      mode === "init" || remaining > 0
        ? (chooseForPractice({
            objectives: yamlObjectives,
            difficulty: targetDiff,
            weaknessTags: expandedWeaknessTags,
            avoidIds: usedIdsFromHistory,
          }) ?? yamlObjectives.find(o => !usedIdsFromHistory.includes(o.id)) ?? yamlObjectives[0] ?? null)
        : null;

    console.log("[practice] chosen objective:", nextObj ? { id: nextObj.id, title: nextObj.title, diff: nextObj.difficulty } : null);
    console.log("[practice] expandedWeaknessTags:", expandedWeaknessTags);
    console.log("[practice] avoidIds:", usedIdsFromHistory);

    const languageLines =
      settings.subjectSlug === "languages" && settings.langName
        ? [
            `TARGET LANGUAGE: ${settings.langName}.`,
            `All questions must involve ${settings.langName} vocabulary for "${settings.skillTitle}".`,
            `Ask in English, but REQUIRE the learner's answer in ${settings.langName}.`,
          ]
        : [];

    const sysLines = [
      `You are an expert question writer and marker for ${settings.subject}, topic: ${settings.skillTitle}.`,
      `Learner level: UK Year ${settings.level.replace(/^y/i, "")} (age ~${settings.age}).`,
      `Write questions one at a time. Keep numbers simple and stay narrowly on-topic.`,
      `Difficulty setting: ${settings.difficulty} (${(
        { warmup: "simple numbers and direct steps", standard: "typical classroom problems", challenge: "trickier numbers or multi-step" } as const
      )[settings.difficulty]}).`,
      nextObj ? `CURRENT OBJECTIVE: ${nextObj.title}` : `CURRENT OBJECTIVE: (fallback — objectives not found)`,
      nextObj ? `Ensure the question directly assesses: "${nextObj.title}".` : "",
      // anti-repetition + text-only
      `Plain text only — no images, diagrams, PDFs, or “draw/see picture”. If a diagram would help, describe it in words.`,
      `Vary question type across the session (direct answer, comparison, fill-the-blank, short word problem, true/false, 3-option multiple choice). Avoid reusing earlier phrasings or exact numbers.`,
      ...languageLines,
      settings.focusWeaknesses && weaknessTitles.length
        ? `Focus more on these weak objectives: ${weaknessTitles.join(", ")}.`
        : `If no weaknesses are supplied, choose a representative objective.`,
      settings.objectives.length ? `Learning objectives (from curriculum): ${settings.objectives.join(" | ")}` : ``,
      `IMPORTANT: Output JSON ONLY with the schema described. No markdown or backticks.`,
    ]
      .filter(Boolean)
      .join("\n");

    const schema = {
      init: { type: "object", required: ["question"], properties: { question: { type: "string" } } },
      grade: {
        type: "object",
        required: ["correct", "correctAnswer", "rationale", "finish"],
        properties: {
          correct: { type: "boolean" },
          correctAnswer: { type: "string" },
          rationale: { type: "string" },
          finish: { type: "boolean" },
          question: { type: "string" },
          tips: { type: "string" },
        },
      },
    };

    const askedBefore = (history ?? []).map(h => h.question).slice(-6); // last few to steer variety

    let userContent = "";
    if (mode === "init") {
      userContent =
        `Create the first question now.\n` +
        (nextObj ? `Target objective: "${nextObj.title}".\n` : ``) +
        (askedBefore.length ? `Previously asked (avoid repeating patterns): ${JSON.stringify(askedBefore)}\n` : ``) +
        `Respond as JSON: ${JSON.stringify(schema.init)}.`;
    } else {
      userContent =
        `Grade the learner's last answer and then decide whether to finish or continue.\n` +
        (nextObj ? `Next question must assess: "${nextObj.title}".\n` : ``) +
        (askedBefore.length ? `Previously asked in this session: ${JSON.stringify(askedBefore)}\n` : ``) +
        `Last QA: ${JSON.stringify(last)}\n` +
        `Previous marked history: ${JSON.stringify(history)}\n` +
        `Remaining after this grading: ${remaining}\n` +
        `If remaining > 0, provide a new question that is not a rephrase of earlier ones.\n` +
        `Respond as JSON: ${JSON.stringify(schema.grade)}.`;
    }

    console.log("[practice] sysLines:\n", sysLines);
    console.log("[practice] userContent:\n", userContent);

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6, // a little more variety
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: sysLines }, { role: "user", content: userContent }],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("[practice] Upstream error", resp.status, txt);
      return new Response(JSON.stringify({ error: "Upstream error" }), { status: 502 });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";

    type InitModelResponse = { question: string };
    type GradeModelResponse = {
      correct: boolean;
      correctAnswer: string;
      rationale: string;
      finish: boolean;
      question?: string;
      tips?: string;
    };

    function isInit(x: unknown): x is InitModelResponse {
      return !!x && typeof x === "object" && typeof (x as { question?: unknown }).question === "string";
    }
    function isGrade(x: unknown): x is GradeModelResponse {
      if (!x || typeof x !== "object") return false;
      const o = x as Record<string, unknown>;
      return typeof o.correct === "boolean" && typeof o.correctAnswer === "string" && typeof o.rationale === "string" && typeof o.finish === "boolean";
    }

    let parsed: unknown;
    try { parsed = JSON.parse(content) as unknown; } catch { parsed = null; }

    if (mode === "init") {
      if (!isInit(parsed)) return new Response(JSON.stringify({ error: "Bad model response" }), { status: 502 });
      return new Response(JSON.stringify({ question: (parsed as InitModelResponse).question, objectiveId: nextObj?.id ?? null }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    } else {
      if (!isGrade(parsed)) return new Response(JSON.stringify({ error: "Bad model response" }), { status: 502 });
      const finish = parsed.finish;
      const out = {
        correct: parsed.correct,
        correctAnswer: parsed.correctAnswer,
        rationale: parsed.rationale,
        finish,
        question: finish ? undefined : String(parsed.question ?? ""),
        objectiveId: finish ? undefined : (nextObj?.id ?? null), // <-- carry forward
        tips: finish ? String(parsed.tips ?? "") : undefined,
      };
      return new Response(JSON.stringify(out), { status: 200, headers: { "Content-Type": "application/json" } });
    }
  } catch (e: unknown) {
    if (e instanceof Error) console.error("[practice] Handler error:", e.message);
    else console.error("[practice] Handler error:", e);
    return new Response(JSON.stringify({ error: "Bad request" }), { status: 400 });
  }
}
