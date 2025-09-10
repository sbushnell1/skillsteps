// lib/objectives.ts
import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

export type DifficultyBand = "basic" | "intermediate" | "stretch";

export type Objective = {
  id: string;            // e.g. "MTH.Y1.N100.COMPARE"
  title: string;         // from YAML "label"
  difficulty: DifficultyBand;
  tags?: string[];
};

type ObjectiveIndex = {
  [level: string]: {
    [subject: string]: {
      [skill: string]: Objective[];
    };
  };
};

// ---------------- Normalisation helpers ----------------

function mapDifficulty(raw: string | undefined): DifficultyBand {
  const v = String(raw ?? "").toLowerCase().trim();
  if (v === "basic" || v === "foundation") return "basic";
  if (v === "stretch" || v === "challenge" || v === "extension") return "stretch";
  // YAML uses "core" — treat as intermediate
  return "intermediate";
}

// ---------------- File loading & caching ----------------

let _cachePromise: Promise<ObjectiveIndex> | null = null;

async function loadYaml(): Promise<ObjectiveIndex> {
  const filePath = path.join(process.cwd(), "data", "objectives.yaml");
  console.log("[obj:get] path", { filePath });

  const raw = await fs.readFile(filePath, "utf8");
  const parsed = YAML.parse(raw) as unknown;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("objectives.yaml: root is not an object");
  }

  // Your YAML shape:
  // levels:
  //   y1:
  //     maths:
  //       number-to-100:
  //         title: ...
  //         objectives: [{ id, label, difficulty }, ...]
  const root = parsed as {
    levels?: Record<
      string,
      Record<
        string,
        Record<
          string,
          { title?: string; objectives?: Array<{ id: string; label: string; difficulty?: string; tags?: string[] }> }
        >
      >
    >;
  };

  const out: ObjectiveIndex = {};
  const levels = root.levels ?? {};

  for (const [level, subjects] of Object.entries(levels)) {
    out[level] = out[level] ?? {};
    for (const [subject, skills] of Object.entries(subjects ?? {})) {
      out[level][subject] = out[level][subject] ?? {};
      for (const [skill, payload] of Object.entries(skills ?? {})) {
        const list = (payload?.objectives ?? []).map((o) => ({
          id: String(o.id),
          title: String(o.label), // <- YAML uses "label"
          difficulty: mapDifficulty(o.difficulty),
          tags: Array.isArray(o.tags) ? o.tags : undefined,
        })) as Objective[];

        out[level][subject][skill] = list;
      }
    }
  }

  // Debug after parse/normalise
  const sample = (() => {
    for (const l of Object.keys(out)) {
      for (const s of Object.keys(out[l])) {
        for (const k of Object.keys(out[l][s])) {
          return { level: l, subject: s, skill: k, count: out[l][s][k].length };
        }
      }
    }
    return null;
  })();

  console.log("[obj:get] parsed", {
    levels: Object.keys(out).length,
    sample,
  });

  return out;
}

/** Load once per server process; subsequent calls reuse the same promise. */
async function loadObjectivesOnce(): Promise<ObjectiveIndex> {
  if (!_cachePromise) _cachePromise = loadYaml();
  return _cachePromise;
}

// ---------------- Public helpers ----------------

/** Get objectives array for a specific skill. Falls back to empty array. */
export async function getObjectivesForSkill(
  level: string,
  subject: string,
  skill: string
): Promise<Objective[]> {
  const idx = await loadObjectivesOnce();
  const arr = idx[level]?.[subject]?.[skill] ?? [];
  console.log("[obj:get] getObjectivesForSkill", {
    level,
    subject,
    skill,
    found: arr.length,
    ids: arr.map((o) => o.id),
  });
  return arr;
}

/** Split a list of objectives into difficulty bands. */
export function splitByDifficulty(objs: Objective[]) {
  const out: Record<DifficultyBand, Objective[]> = {
    basic: [],
    intermediate: [],
    stretch: [],
  };
  for (const o of objs) {
    if (o?.difficulty === "basic") out.basic.push(o);
    else if (o?.difficulty === "stretch") out.stretch.push(o);
    else out.intermediate.push(o);
  }
  return out;
}

// ---- Selection logic (Practice & Test) ----

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function scoreObjectiveMatch(o: Objective, weaknessTerms: string[]): number {
  if (!weaknessTerms.length) return 0;
  const hay = norm([o.title, ...(o.tags ?? [])].join(" "));
  let score = 0;
  for (const t of weaknessTerms) {
    const needle = norm(t);
    if (!needle) continue;
    if (hay.includes(needle)) score += 2;
    else if (new RegExp(`\\b${needle}\\b`).test(hay)) score += 3;
    else if (needle.length >= 4 && hay.includes(needle.slice(0, Math.min(needle.length, 6)))) score += 1;
  }
  return score;
}

/** Choose ONE objective for Practice. */
export function chooseForPractice(opts: {
  objectives: Objective[];
  difficulty: DifficultyBand;
  weaknessTags?: string[];
  avoidIds?: string[];
}): Objective | null {
  const { objectives, difficulty, weaknessTags = [], avoidIds = [] } = opts;
  if (!objectives.length) return null;

  const avoid = new Set((avoidIds ?? []).filter(Boolean));
  const pool = objectives.filter((o) => !avoid.has(o.id));
  if (!pool.length) return null;

  const prim = pool.filter((o) => o.difficulty === difficulty);
  const bucket = prim.length ? prim : pool;

  const scored = bucket.map((o) => ({
    o,
    s: scoreObjectiveMatch(o, weaknessTags),
    r: Math.random(),
  }));
  scored.sort((a, b) => (b.s - a.s) || (a.r - b.r));
  return scored[0]?.o ?? null;
}

/** Choose a set for Test generation by distribution. */
export function chooseForTest(opts: {
  objectives: Objective[];
  distribution: { basic: number; intermediate: number; stretch: number };
}): Objective[] {
  const { objectives, distribution } = opts;
  const bands = splitByDifficulty(objectives);

  const pickFrom = (arr: Objective[], n: number, used: Set<string>) => {
    const out: Objective[] = [];
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    for (const o of shuffled) {
      if (out.length >= n) break;
      if (used.has(o.id)) continue;
      out.push(o);
      used.add(o.id);
    }
    return out;
  };

  const used = new Set<string>();
  const result: Objective[] = [];
  result.push(...pickFrom(bands.basic, distribution.basic, used));
  result.push(...pickFrom(bands.intermediate, distribution.intermediate, used));
  result.push(...pickFrom(bands.stretch, distribution.stretch, used));

  const targetTotal = distribution.basic + distribution.intermediate + distribution.stretch;
  if (result.length < targetTotal) {
    const anyLeft = [...bands.basic, ...bands.intermediate, ...bands.stretch].filter((o) => !used.has(o.id));
    const shuffled = anyLeft.sort(() => Math.random() - 0.5);
    for (const o of shuffled) {
      if (result.length >= targetTotal) break;
      result.push(o);
      used.add(o.id);
    }
  }

  while (result.length < targetTotal && objectives.length) {
    result.push(objectives[result.length % objectives.length]);
  }
  return result.slice(0, targetTotal);
}
