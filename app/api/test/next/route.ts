// app/api/test/next/route.ts
import { NextRequest } from "next/server";
import { getObjectivesForSkill, chooseForTest } from "../../../lib/objectives";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const API_KEY = process.env.OPENAI_API_KEY!;

type InitPayload = {
  mode: "init";
  level: string;
  subject: string;       // subjectSlug
  skill: string;         // skillSlug
  age: number;
  total?: number;        // default 20
  distribution?: { basic: number; intermediate: number; stretch: number }; // optional override
};

type GradePayload = {
  mode: "grade";
  plan: Array<{ id: string; title: string; difficulty: "basic" | "intermediate" | "stretch" }>;
  index: number;         // 0-based index we just answered
  last: { question: string; userAnswer: string };
  history: Array<{
    i: number;           // index in plan
    question: string;
    userAnswer: string;
    correct: boolean;
    correctAnswer: string;
  }>;
  level: string;
  subject: string;       // subjectSlug
  skill: string;         // skillSlug
  age: number;
};

type SchemaInit = { question: string };
type SchemaGrade = {
  correct: boolean;
  correctAnswer: string;
  rationale: string;
  finish: boolean;
  question?: string;
};

function isInitPayload(x: unknown): x is InitPayload {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return o.mode === "init" && typeof o.level === "string" && typeof o.subject === "string" && typeof o.skill === "string";
}

// Put these small helpers above isGradePayload
const isString = (v: unknown): v is string =>
    typeof v === "string";
  
  const isNumber = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);
  
  const has = <K extends string>(obj: unknown, key: K): obj is Record<K, unknown> =>
    typeof obj === "object" && obj !== null && key in obj;
  
  function isGradePayload(x: unknown): x is GradePayload {
    if (typeof x !== "object" || x === null) return false;
  
    if (!has(x, "mode") || x.mode !== "grade") return false;
    if (!has(x, "plan") || !Array.isArray(x.plan)) return false;
    if (!has(x, "index") || !isNumber(x.index)) return false;
  
    if (!has(x, "last")) return false;
    const last = x.last;
    if (typeof last !== "object" || last === null) return false;
    if (!has(last, "question") || !isString(last.question)) return false;
    if (!has(last, "userAnswer") || !isString(last.userAnswer)) return false;
  
    if (!has(x, "level") || !isString(x.level)) return false;
    if (!has(x, "subject") || !isString(x.subject)) return false;
    if (!has(x, "skill") || !isString(x.skill)) return false;
  
    return true;
  }
  
  

export async function POST(req: NextRequest) {
  try {
    if (!API_KEY) return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500 });
    const body = await req.json();

    // ---------- INIT ----------
    if (isInitPayload(body)) {
      const total = Math.max(1, body.total ?? 20);
      const distDefault = { basic: 8, intermediate: 8, stretch: 4 };
      const distribution = body.distribution ?? distDefault;

      const all = await getObjectivesForSkill(body.level, body.subject, body.skill);
      if (!all.length) {
        return new Response(JSON.stringify({ error: "No objectives for this skill" }), { status: 404 });
      }

      // Size distribution to sum to "total"
      const sum = distribution.basic + distribution.intermediate + distribution.stretch;
      const scale = total / sum;
      const sized = {
        basic: Math.max(0, Math.round(distribution.basic * scale)),
        intermediate: Math.max(0, Math.round(distribution.intermediate * scale)),
        stretch: Math.max(0, Math.round(distribution.stretch * scale)),
      };
      // Adjust rounding drift
      // Adjust rounding drift
let drift = total - (sized.basic + sized.intermediate + sized.stretch);
while (drift !== 0) {
  if (drift > 0) {
    // Add to preferred bucket (intermediate → basic → stretch)
    sized.intermediate++;
    drift--;
  } else {
    // Remove from a bucket that still has items
    if (sized.intermediate > 0) {
      sized.intermediate--;
      drift++;
    } else if (sized.basic > 0) {
      sized.basic--;
      drift++;
    } else if (sized.stretch > 0) {
      sized.stretch--;
      drift++;
    } else {
      break; // nothing to adjust; safety
    }
  }
}


      const chosen = chooseForTest({ objectives: all, distribution: sized });
      // flatten to a plan we can roundtrip via client state
      const plan = chosen.map(o => ({ id: o.id, title: o.title, difficulty: o.difficulty }));

      // First question using objective 0
      const firstObjective = plan[0];
      const q1 = await makeQuestion({
        subjectSlug: body.subject,
        skillTitle: firstObjective.title,
        level: body.level,
        age: body.age ?? 10,
        objectiveTitle: firstObjective.title,
      });

      return new Response(JSON.stringify({
        plan,
        first: { index: 0, question: q1 },
        total,
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // ---------- GRADE ----------
    if (isGradePayload(body)) {
      const { plan, index, last, history, level, subject, age } = body;
      const total = plan.length;

      // Grade the last answer
      const graded = await gradeAnswer({
        subjectSlug: subject,
        skillTitle: plan[index]?.title ?? "(unknown)",
        level,
        age,
        question: last.question,
        userAnswer: last.userAnswer,
      });

      const soFar = [...history, {
        i: index,
        question: last.question,
        userAnswer: last.userAnswer,
        correct: graded.correct,
        correctAnswer: graded.correctAnswer,
      }];

      const nextIndex = index + 1;
      const finish = nextIndex >= total;

      if (finish) {
        const score = soFar.reduce((s, r) => s + (r.correct ? 1 : 0), 0);
        return new Response(JSON.stringify({
          correct: graded.correct,
          correctAnswer: graded.correctAnswer,
          rationale: graded.rationale,
          finish: true,
          score,
          total,
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      // Ask next question targeted to the plan’s next objective
      const nextObj = plan[nextIndex];
      const nextQ = await makeQuestion({
        subjectSlug: subject,
        skillTitle: nextObj.title,
        level,
        age,
        objectiveTitle: nextObj.title,
      });

      return new Response(JSON.stringify({
        correct: graded.correct,
        correctAnswer: graded.correctAnswer,
        rationale: graded.rationale,
        finish: false,
        next: { index: nextIndex, question: nextQ }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Bad request" }), { status: 400 });

  } catch (e) {
    console.error("[test] handler error:", e);
    return new Response(JSON.stringify({ error: "Bad request" }), { status: 400 });
  }
}

function isSchemaGrade(x: unknown): x is SchemaGrade {
    if (typeof x !== "object" || x === null) return false;
    const o = x as Record<string, unknown>;
    return (
      typeof o.correct === "boolean" &&
      typeof o.correctAnswer === "string" &&
      typeof o.rationale === "string" &&
      typeof o.finish === "boolean"
    );
  }
  
  // Minimal shape of an OpenAI chat completion we care about
type ChatMessage = { content?: string };
type ChatChoice  = { message?: ChatMessage };
type ChatCompletion = { choices?: ChatChoice[] };

// Safe extractor for the first message content
function getMessageContent(x: unknown): string {
  if (typeof x === "object" && x !== null) {
    const o = x as Partial<ChatCompletion>;
    const c = o.choices?.[0]?.message?.content;
    if (typeof c === "string") return c;
  }
  return "{}";
}


// ----------------- LLM helpers -----------------

async function makeQuestion(args: {
    subjectSlug: string;
    skillTitle: string;
    level: string;
    age: number;
    objectiveTitle: string;
  }): Promise<string> {
    const system =
      `You are an expert UK primary test writer for ${args.subjectSlug}, topic: ${args.skillTitle}.\n` +
      `Learner: Year ${args.level.replace(/^y/i, "")} (age ~${args.age}).\n` +
      `Write ONE question that directly assesses: "${args.objectiveTitle}". Keep it short and age-appropriate.\n` +
      `IMPORTANT: Output JSON ONLY with { "question": string }. No extra text.`;
  
    const user =
      `Create the question now.\n` +
      `Respond ONLY as JSON { "question": "..." }`;
  
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, { role: "user", content: user }]
      })
    });
  
    const data: unknown = await resp.json();
    const content = getMessageContent(data);

  
    let parsed: unknown = null;
    try { parsed = JSON.parse(content); } catch { parsed = null; }
  
    const q = (parsed as SchemaInit | null)?.question;
    return typeof q === "string" && q.trim() ? q.trim() : "Write a short question for this objective.";
  }
  
  async function gradeAnswer(args: {
    subjectSlug: string;
    skillTitle: string;
    level: string;
    age: number;
    question: string;
    userAnswer: string;
  }): Promise<SchemaGrade> {
    const system =
      `You are a strict but kind UK primary test marker for ${args.subjectSlug}, topic: ${args.skillTitle}.\n` +
      `Learner: Year ${args.level.replace(/^y/i, "")} (age ~${args.age}).\n` +
      `Mark the answer as correct/incorrect. Keep rationale short. IMPORTANT: JSON ONLY: { correct, correctAnswer, rationale, finish }.`;
  
    const user =
      `Question: ${args.question}\n` +
      `Learner's answer: ${args.userAnswer}\n` +
      `Respond ONLY as JSON with fields: correct (boolean), correctAnswer (string), rationale (string), finish (boolean=false).`;
  
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, { role: "user", content: user }]
      })
    });
  
    const data: unknown = await resp.json();
    const content = getMessageContent(data);

  
    let parsed: unknown = null;
    try { parsed = JSON.parse(content); } catch { parsed = null; }
  
    if (isSchemaGrade(parsed)) return parsed;
  
    return {
      correct: false,
      correctAnswer: "",
      rationale: "Couldn’t mark this one.",
      finish: false,
    };
  }
  