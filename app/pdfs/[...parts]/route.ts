// app/pdfs/[...parts]/route.ts
import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SEG = /^[a-z0-9_-]+$/i;

export async function GET(
  _req: NextRequest,
  { params }: { params: { parts: string[] } }
) {
  const raw = (params.parts ?? []).filter(Boolean);

  if (raw.length < 3) {
    return new Response(JSON.stringify({ error: "Invalid PDF path" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!raw.every((p) => VALID_SEG.test(p))) {
    return new Response(JSON.stringify({ error: "Bad path" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // allow optional .pdf in the URL
  const parts = [...raw];
  parts[parts.length - 1] = parts[parts.length - 1].replace(/\.pdf$/i, "");

  // <projectRoot>/pdfs/<level>/<subject>/<slug>.pdf
  const filePath = path.join(process.cwd(), "pdfs", ...parts) + ".pdf";
  console.log("[pdfs] Attempting to read:", filePath);

  try {
    const buf = await fs.readFile(filePath);
    const bytes = new Uint8Array(buf);

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600, must-revalidate",
      },
    });
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    console.error("[pdfs] Read error:", e?.code, e?.message);
    return new Response(JSON.stringify({ error: "PDF not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
}
