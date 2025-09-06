import Link from "next/link";
import React from "react";
import { notFound } from "next/navigation";
import { LANGUAGES, LANGUAGE_SKILLS, type LangCode } from "../../../../../data/languages";

const LEVEL = "y6" as const;

export function generateStaticParams() {
  const params: { lang: LangCode; skill: string }[] = [];
  for (const l of LANGUAGES) {
    for (const s of LANGUAGE_SKILLS) params.push({ lang: l.code, skill: s.slug });
  }
  return params;
}

export default function LangSkillPage({ params }: { params: { lang: LangCode; skill: string } }) {
  const lang = LANGUAGES.find(l => l.code === params.lang);
  const skill = LANGUAGE_SKILLS.find(s => s.slug === params.skill);
  if (!lang || !skill) return notFound();

  // If you keep PDFs per language, follow this naming convention
  const pdf = `/pdfs/${LEVEL}/languages/${lang.code}/${skill.slug}.pdf`;

  return (
    <div>
      <h1 className="h1">{lang.name}</h1>
      <p className="sub">Topic: <strong>{skill.title}</strong></p>

      <div className="subject-grid" style={{ "--min": "260px" } as React.CSSProperties}>
        <a className="subject-card" href={pdf} target="_blank" rel="noreferrer">
          <div className="subject-inner">
            <div className="subject-label">Overview</div>
            <div className="sub">View Summary PDF</div>
          </div>
        </a>

        <Link className="subject-card" href={`/learn/languages/${lang.code}/${skill.slug}/expand`}>
          <div className="subject-inner">
            <div className="subject-label">Dive Deeper</div>
            <div className="sub">Ask questions</div>
          </div>
        </Link>

        <Link className="subject-card" href={`/learn/languages/${lang.code}/${skill.slug}/practice`}>
          <div className="subject-inner">
            <div className="subject-label">Practice Questions</div>
            <div className="sub">Test your knowledge!</div>
          </div>
        </Link>

        <Link className="subject-card" href={`/learn/languages/${lang.code}/${skill.slug}/resources`}>
          <div className="subject-inner">
            <div className="subject-label">More Resources</div>
            <div className="sub">Home ideas & downloads</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
