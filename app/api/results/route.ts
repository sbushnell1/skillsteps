// app/api/results/route.ts
import { NextRequest } from "next/server";
import { saveTestResult, getRecentResults, type TestResult } from "../../lib/localStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const year = url.searchParams.get("year") ?? "";
  const subject = url.searchParams.get("subject") ?? "";
  const skill = url.searchParams.get("skill") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? "5");

  if (!year || !subject || !skill) {
    return new Response(JSON.stringify({ error: "Missing year/subject/skill" }), { status: 400 });
  }

  try {
    const out = await getRecentResults({ year, subject, skill, limit });
    return new Response(JSON.stringify({ results: out }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[results:get] error:", e);
    return new Response(JSON.stringify({ error: "Failed to read results" }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TestResult;

    // minimal validation
    if (!body || !body.userId || !body.dateISO || !body.year || !body.subject || !body.skill) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }
    await saveTestResult(body);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[results:post] error:", e);
    return new Response(JSON.stringify({ error: "Failed to save result" }), { status: 500 });
  }
}
