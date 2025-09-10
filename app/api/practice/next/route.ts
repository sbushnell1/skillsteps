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
  objectives: string[];      // kept for backwards-compat; we now source from YAML
  weaknesses: string[];      // short tags/phrases (optional)
  langName?: string;         // "German"
  langCode?: string;         // "de"
};

// UI difficulty -> YAML band
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
      last?: { n: number; question: string; userAnswer: string };
      history: Array<{
        n: number;
        question: string;
        userAnswer: string;
        correct: boolean;
        correctAnswer: string;
        rationale?: string;
      }>;
    };

    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500 });
    }

    const { mode, settings, last, history } = body;

    const remaining =
      settings.total - (history?.length ?? 0) - (mode === "grade" ? 1 : 0);

    // ---- Load objectives from YAML for this skill ----
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
    });
    console.log("[practice] yamlObjectives:", {
      count: yamlObjectives.length,
      ids: yamlObjectives.map((o) => o.id),
    });

    // Desired difficulty for the next question
    const targetDiff = mapPracticeToObjectiveDifficulty(settings.difficulty);

    // Weakness tags to bias selection (optional)
    const weaknessTags =
      settings.focusWeaknesses && settings.weaknesses?.length
        ? settings.weaknesses
        : [];

    // Pick ONE objective for the next question (for init always; for grade only if continuing)
    const nextObj =
      (mode === "init" || remaining > 0)
        ? (chooseForPractice({
            objectives: yamlObjectives,
            difficulty: targetDiff,
            weaknessTags,
            avoidIds: [], // hook up if you later track used objective ids
          }) ?? yamlObjectives[0] ?? null)
        : null;

    console.log(
      "[practice] chosen objective:",
      nextObj ? { id: nextObj.id, title: nextObj.title, diff: nextObj.difficulty } : null
    );

    // Language rules (as before)
    const languageLines =
      settings.subjectSlug === "languages" && settings.langName
        ? [
            `TARGET LANGUAGE: ${settings.langName}.`,
            `All questions must involve ${settings.langName} vocabulary/phrases for the topic "${settings.skillTitle}".`,
            `Ask/prompt in English, but REQUIRE the learner's answer in ${settings.langName}.`,
            `If the learner answers in English when a ${settings.langName} answer is expected, mark incorrect and provide the correct ${settings.langName} form.`,
            `Prefer short, age-appropriate items: single-word translations, short phrases, or fill-the-gap in ${settings.langName}.`,
          ]
        : [];

    // === System prompt (tight & YAML-aware) ===
    const sysLines = [
      `You are an expert question writer and marker for ${settings.subject}, topic: ${settings.skillTitle}.`,
      `Learner level: UK Year ${settings.level.replace(/^y/i, "")} (age ~${settings.age}).`,
      `Write questions one at a time. Keep numbers simple and stay narrowly on-topic.`,
      `Difficulty setting: ${settings.difficulty} (${(
        { warmup: "simple numbers and direct steps", standard: "typical classroom problems", challenge: "trickier numbers or multi-step" } as const
      )[settings.difficulty]}).`,
      nextObj
        ? `CURRENT OBJECTIVE: ${nextObj.title}`
        : `CURRENT OBJECTIVE: (fallback — objectives not found for this skill)`,
      nextObj ? `Ensure the question directly assesses: "${nextObj.title}". Avoid repeating prior phrasing.` : "",
      ...languageLines,
      settings.focusWeaknesses && settings.weaknesses.length
        ? `Focus more on the learner weaknesses: ${settings.weaknesses.join(", ")}.`
        : `FocusWeaknesses is currently off or unavailable.`,
      settings.objectives.length
        ? `Learning objectives (from curriculum): ${settings.objectives.join(" | ")}`
        : ``,
      `IMPORTANT: Output JSON ONLY with the schema described.`,
      `Do not include markdown, text outside JSON, or backticks.`,
    ]
      .filter(Boolean)
      .join("\n");

    // === Schema & user message ===
    const schema = {
      init: {
        type: "object",
        required: ["question"],
        properties: {
          question: {
            type: "string",
            description: "A single clear question, suitable for the level.",
          },
        },
      },
      grade: {
        type: "object",
        required: ["correct", "correctAnswer", "rationale", "finish"],
        properties: {
          correct: { type: "boolean" },
          correctAnswer: { type: "string" },
          rationale: {
            type: "string",
            description: "Short explanation in kid-friendly words.",
          },
          finish: { type: "boolean" },
          question: {
            type: "string",
            description: "Next question if not finished.",
          },
          tips: {
            type: "string",
            description: "Short advice at the end, based on mistakes.",
          },
        },
      },
    };

    let userContent = "";
    if (mode === "init") {
      userContent =
        `Create the first question now.\n` +
        (nextObj ? `Target objective: "${nextObj.title}".\n` : ``) +
        `Do NOT include the answer in the question.\n` +
        `Avoid reusing the exact phrasing of previous questions.\n` +
        `Respond as JSON: ${JSON.stringify(schema.init)}.`;
    } else {
      userContent =
        `Grade the learner's last answer and decide if we should finish or continue.\n` +
        (nextObj ? `Next question must assess: "${nextObj.title}".\n` : ``) +
        `Last QA: ${JSON.stringify(last)}\n` +
        `Previous marked history: ${JSON.stringify(history)}\n` +
        `Remaining after this grading: ${remaining}\n` +
        `If remaining > 0, provide a new question that avoids repeating earlier ones.\n` +
        `Respond as JSON: ${JSON.stringify(schema.grade)}.`;
    }

    console.log("[practice] sysLines:\n", sysLines);
    console.log("[practice] userContent:\n", userContent);

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: sysLines },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("[practice] Upstream error", resp.status, txt);
      return new Response(JSON.stringify({ error: "Upstream error" }), {
        status: 502,
      });
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
      return (
        typeof o.correct === "boolean" &&
        typeof o.correctAnswer === "string" &&
        typeof o.rationale === "string" &&
        typeof o.finish === "boolean"
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      parsed = null;
    }

    if (mode === "init") {
      if (!isInit(parsed)) {
        return new Response(JSON.stringify({ error: "Bad model response" }), { status: 502 });
      }
      return new Response(JSON.stringify({ question: parsed.question }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      if (!isGrade(parsed)) {
        return new Response(JSON.stringify({ error: "Bad model response" }), { status: 502 });
      }
      const finish = parsed.finish;
      const out = {
        correct: parsed.correct,
        correctAnswer: parsed.correctAnswer,
        rationale: parsed.rationale,
        finish,
        question: finish ? undefined : String(parsed.question ?? ""),
        tips: finish ? String(parsed.tips ?? "") : undefined,
      };
      return new Response(JSON.stringify(out), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error("[practice] Handler error:", e.message);
    } else {
      console.error("[practice] Handler error:", e);
    }
    return new Response(JSON.stringify({ error: "Bad request" }), { status: 400 });
  }
}
