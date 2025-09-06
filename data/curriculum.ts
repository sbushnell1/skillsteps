// data/curriculum.ts
export type Level = "y6";
export type SubjectSlug = "maths" | "english" | "science" | "history" | "geography" | "languages";

export type Skill = {
  id: string;              // "y6.maths.fractions"
  slug: string;            // "fractions"
  title: string;           // "Fractions"
  level: Level;            // "y6"
  subject: SubjectSlug;    // "maths"
  pdf?: string;            // "/pdfs/y6/maths/fractions.pdf" (public/)
  objectives?: string[];   // optional learning objectives
  resources?: {label: string; url: string}[];
};

export type Curriculum = Record<Level, Record<SubjectSlug, Skill[]>>;

export const CURRICULUM: Curriculum = {
  y6: {
    maths: [
      {
        id: "y6.maths.fractions",
        slug: "fractions",
        title: "Fractions",
        level: "y6",
        subject: "maths",
        pdf: "/pdfs/y6/maths/fractions.pdf",
        objectives: [
          "Compare and order fractions",
          "Add and subtract fractions with common denominators",
        ],
        resources: [{ label: "BBC Bitesize – Fractions", url: "https://www.bbc.co.uk/bitesize/topics/..." }],
      },
      { id: "y6.maths.decimals", slug: "decimals", title: "Decimals", level: "y6", subject: "maths", pdf: "/pdfs/y6/maths/decimals.pdf" },
      { id: "y6.maths.percentages", slug: "percentages", title: "Percentages", level: "y6", subject: "maths", pdf: "/pdfs/y6/maths/percentages.pdf" },
      { id: "y6.maths.geometry", slug: "geometry", title: "Geometry", level: "y6", subject: "maths" },
      { id: "y6.maths.long-division", slug: "long-division", title: "Long Division", level: "y6", subject: "maths" },
      { id: "y6.maths.probability", slug: "probability", title: "Probability", level: "y6", subject: "maths" },
      { id: "y6.maths.algebra", slug: "algebra", title: "Algebra", level: "y6", subject: "maths" },
    ],
    geography: [
      { id: "y6.geography.maps", slug: "maps", title: "Maps & Atlases", level: "y6", subject: "geography", pdf: "/pdfs/y6/geography/maps.pdf" },
      { id: "y6.geography.biomes", slug: "biomes", title: "Biomes", level: "y6", subject: "geography" },
    ],
    english: [], science: [], history: [], languages: [],
  },
};

// Simple helpers so pages don’t know the shape of CURRICULUM
export function getSkills(level: Level, subject: SubjectSlug) {
  return CURRICULUM[level]?.[subject] ?? [];
}

export function getSkill(level: Level, subject: SubjectSlug, skillSlug: string) {
  return getSkills(level, subject).find(s => s.slug === skillSlug);
}

// For static generation
export function allSubjectSlugs(level: Level): SubjectSlug[] {
  return Object.keys(CURRICULUM[level]) as SubjectSlug[];
}

export function allSkillParams(level: Level) {
  const params: Array<{ subject: SubjectSlug; skill: string }> = [];
  for (const subject of allSubjectSlugs(level)) {
    for (const s of getSkills(level, subject)) params.push({ subject, skill: s.slug });
  }
  return params;
}
