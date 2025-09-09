// app/learn/languages/[lang]/[skill]/practice/page.tsx
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import React from "react";
import PracticeTrainer from "../../../../../components/PracticeTrainer";
import { LANGUAGES, LANGUAGE_SKILLS, type LangCode } from "../../../../../../data/languages";
import { levelForAge } from "../../../../../../data/ages";

export const dynamic = "force-dynamic";

export default async function LangPracticePage(
    { params }: { params: { lang: LangCode; skill: string } }
  ) {
  const lang = LANGUAGES.find(l => l.code === params.lang);
  const skill = LANGUAGE_SKILLS.find(s => s.slug === params.skill);
  if (!lang || !skill) return notFound();

  // Read age cookie (same pattern you used elsewhere)
  const hdrs = await headers();
  const cookieHeader = hdrs.get("cookie") ?? "";
  const readCookie = (name: string): string | undefined => {
    const esc = name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${esc}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : undefined;
  };

  const ageStr = readCookie("ss.age");
  const age = ageStr ? Number(ageStr) : 10;
  const level = levelForAge(age); // e.g. "y6"

  return (
    <div>
      <h1 className="h1">Languages — {lang.name}</h1>
      <p className="sub">
        Age {age} (Year {level.replace(/^y/i, "")}). Topic: <strong>{skill.title}</strong>
      </p>

      <PracticeTrainer
        subject={`Languages — ${lang.name}`}   
        subjectSlug="languages"
        skillSlug={skill.slug}
        skillTitle={skill.title}
        level={level}
        age={age}
        objectives={[]}
        weaknesses={[]}
        langName={lang.name}         // e.g. "German"
        langCode={lang.code}         // e.g. "de"
      />
    </div>
  );
}
