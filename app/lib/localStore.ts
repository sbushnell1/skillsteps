// lib/localStore.ts
import fs from "node:fs/promises";
import path from "node:path";

export type SavedAnswer = {
  index: number;
  objectiveId: string;
  question: string;
  userAnswer: string;
  correct: boolean;
  correctAnswer: string;
};

export type ObjectiveWeakness = {
  objectiveId: string;
  title: string;
  difficulty: "basic" | "intermediate" | "stretch";
  attempts: number;
  correct: number;
  accuracy: number;
  consideredWeak: boolean;
};

export type TestResult = {
  runId?: string;          // optional for back-compat
  userId: string;
  dateISO: string;
  age: number;
  year: string;
  subject: string;
  skill: string;
  score: number;
  total: number;
  plan: Array<{ id: string; title: string; difficulty: "basic" | "intermediate" | "stretch" }>;
  answers: SavedAnswer[];
  weaknesses: ObjectiveWeakness[];
};

export type TrendRow = {
  runId: string;
  dateISO: string;
  year: string;
  subject: string;
  skill: string;
  objective: string;        // "__overall__" or objectiveId
  objectiveTitle?: string;  // for objective rows
  questions: number;
  score: number;
  accuracy: number;
};

const ROOT_RESULTS = path.join(process.cwd(), ".data", "tests");
const ROOT_TRENDS  = path.join(process.cwd(), ".data", "trends");

function testKey(year: string, subject: string, skill: string) {
  return `${year}__${subject}__${skill}.jsonl`;
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

/* ---------- Results (full-fidelity) ---------- */

export async function saveTestResult(res: TestResult): Promise<void> {
  await ensureDir(ROOT_RESULTS);
  const file = path.join(ROOT_RESULTS, testKey(res.year, res.subject, res.skill));
  const line = JSON.stringify(res) + "\n";
  await fs.appendFile(file, line, "utf8");
  console.log("[results] saved →", file);
}

export async function getRecentResults(opts: {
  year: string;
  subject: string;
  skill: string;
  limit?: number;
}): Promise<TestResult[]> {
  const file = path.join(ROOT_RESULTS, testKey(opts.year, opts.subject, opts.skill));
  try {
    const raw = await fs.readFile(file, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    const parsed = lines.map((l) => JSON.parse(l) as TestResult);
    parsed.sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)); // newest first
    return parsed.slice(0, opts.limit ?? 10);
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err?.code === "ENOENT") return [];
    throw err;
  }
}

/* ---------- Trends (chart-friendly summaries) ---------- */

const TRENDS_FILE = path.join(ROOT_TRENDS, "all.jsonl");

export async function saveTrendRows(rows: TrendRow[]): Promise<void> {
  if (!rows.length) return;
  await ensureDir(ROOT_TRENDS);
  const payload = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
  await fs.appendFile(TRENDS_FILE, payload, "utf8");
  console.log("[trends] +", rows.length, "rows →", TRENDS_FILE);
}

export async function getTrendRows(opts?: {
  subject?: string;
  skill?: string;
  objective?: string;  // "__overall__" or objectiveId
  sinceISO?: string;
  limit?: number;
}): Promise<TrendRow[]> {
  try {
    const raw = await fs.readFile(TRENDS_FILE, "utf8");
    const rows: TrendRow[] = raw.split("\n").filter(Boolean).map((l) => JSON.parse(l));

    let filtered = rows;
    if (opts?.subject)   filtered = filtered.filter(r => r.subject === opts.subject);
    if (opts?.skill)     filtered = filtered.filter(r => r.skill === opts.skill);
    if (opts?.objective) filtered = filtered.filter(r => r.objective === opts.objective);

    const sinceISO = opts?.sinceISO; // narrow first
    if (sinceISO) filtered = filtered.filter(r => r.dateISO >= sinceISO);

    filtered.sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)); // newest first
    return opts?.limit ? filtered.slice(0, opts.limit) : filtered;
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err?.code === "ENOENT") return [];
    throw err;
  }
}
