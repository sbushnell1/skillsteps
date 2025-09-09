// app/learn/languages/[lang]/[skill]/resources/page.tsx
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import React from "react";
import ResourcesPanel from "../../../../../components/ResourcesPanel";
import { levelForAge } from "../../../../../../data/ages";
import { SUBJECTS } from "../../../../../../data/subjects";
import { LANGUAGES, LANGUAGE_SKILLS, type LangCode } from "../../../../../../data/languages";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  const params: { lang: LangCode; skill: string }[] = [];
  for (const l of LANGUAGES) for (const s of LANGUAGE_SKILLS) params.push({ lang: l.code, skill: s.slug });
  return params;
}

export default async function LangResourcesPage({
  params,
}: { params: { lang: LangCode; skill: string } }) {
  const lang = LANGUAGES.find((l) => l.code === params.lang);
  const skill = LANGUAGE_SKILLS.find((s) => s.slug === params.skill);
  if (!lang || !skill) return notFound();

  // Read age cookie (same pattern you’re using elsewhere)
  const hdrs = await headers();
  const cookieHeader = hdrs.get("cookie") ?? "";
  const ageMatch = cookieHeader.match(/(?:^|;\s*)ss\.age=([^;]*)/);
  const age = ageMatch ? Number(decodeURIComponent(ageMatch[1])) : 10;
  const level = levelForAge(age);

  const accent = SUBJECTS.find((s) => s.slug === "languages")?.color ?? "#d7e3f6";

  return (
    <div className="skill-hub" style={{ "--accent": accent } as React.CSSProperties}>
      <h1 className="h1">Languages — {lang.name}</h1>
      <p className="sub">
        Practical ideas for exploring <strong>{skill.title}</strong> at Year {level.replace(/^y/i, "")}.
      </p>

      {/* Pill: go back to this language’s skill list */}
      <div className="pill-wrap">
        <Link className="topic-pill topic-pill-link" href={`/learn/languages/${lang.code}`}>
          {skill.title} · {level.toUpperCase()}
        </Link>
      </div>

      <ResourcesPanel
        subject={`Languages — ${lang.name}`}
        subjectSlug="languages"
        skillSlug={skill.slug}
        skillTitle={skill.title}
        level={level}
        age={age}
        objectives={[]}              // add later if you maintain per-skill objectives
        staticReading={[]}           // can pass curriculum resources if you add them
        langName={lang.name}         // e.g. "German"
        langCode={lang.code}         // e.g. "de"
      />
    </div>
  );
}
