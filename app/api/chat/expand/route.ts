// app/api/chat/expand/route.ts
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const API_KEY = process.env.OPENAI_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
        subject,
        skillTitle,
        level,
        age,
        objectives = [],
        pdfUrl,
        messages = [],
      } = body as {
        subject: string;
        skillTitle: string;
        level: string;
        age: number;
        objectives: string[];
        pdfUrl?: string;
        messages: { role: "user" | "assistant" | "system"; content: string }[];
      };
      

    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500 });
    }

    // tight, explanation-only system
    const system = [
      `You are a kind, patient tutor for a child learning ${subject} → ${skillTitle} at UK Year ${level.replace(/^y/i, "")} (age ~${age}).`,
      `Only give explanations, examples, clarifications, rules of thumb, and short fun facts.`,
      `Avoid quizzes, practice questions, tests, scoring, or asking the child to answer. That happens in a different section.`,
      `Keep answers short and simple. Prefer small numbers and step-by-step wording.`,
      `Stay narrowly within topic scope: ${subject} / ${skillTitle}. Related nearby ideas are okay if they directly help explain this topic.`,
      `If asked something off-topic, gently say you can only help with ${skillTitle} now and suggest going back to choose a different topic.`,
      objectives.length ? `Learning objectives: ${objectives.join(" | ")}` : ``,
      pdfUrl ? `Reference summary PDF: ${pdfUrl}` : ``,
    ].filter(Boolean).join("\n");

    // lightweight content filter: trim user messages to last few turns
    const history = messages.slice(-6);

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 450,
        messages: [
          { role: "system", content: system },
          ...history.map(m => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[expand] OpenAI error:", resp.status, errText);
      return new Response(JSON.stringify({ error: "Upstream error" }), { status: 502 });
    }

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content ?? "Sorry, I couldn’t find a simple way to say that.";
    return new Response(JSON.stringify({ reply }), { status: 200, headers: { "Content-Type": "application/json" } });
} catch (e: unknown) {
    if (e instanceof Error) {
      console.error("[expand] Handler error:", e.message);
    } else {
      console.error("[expand] Handler error:", e);
    }
    return new Response(JSON.stringify({ error: "Bad request" }), { status: 400 });
  }
  
}
