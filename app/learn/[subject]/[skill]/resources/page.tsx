// app/learn/[subject]/[skill]/resources/page.tsx
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import React from "react";
import { SUBJECTS } from "../../../../../data/subjects";
import { getSkill, type SubjectSlug } from "../../../../../data/curriculum";
import { levelForAge } from "../../../../../data/ages";
import ResourcesPanel from "../../../../components/ResourcesPanel";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ResourcesPage({
  params,
}: { params: { subject: SubjectSlug; skill: string } }) {
  const subject = SUBJECTS.find((s) => s.slug === params.subject);
  if (!subject) return notFound();

  // Read age cookie (keeping your working pattern)
  const hdrs = await headers();
  const cookieHeader = hdrs.get("cookie") ?? "";
  const ageMatch = cookieHeader.match(/(?:^|;\s*)ss\.age=([^;]*)/);
  const age = ageMatch ? Number(decodeURIComponent(ageMatch[1])) : 10;
  const level = levelForAge(age);

  let skill = getSkill(level, params.subject, params.skill);
  if (!skill) skill = getSkill("y6", params.subject, params.skill);
  if (!skill) return notFound();

  // Map static Skill.resources (links) into readingWatching-like items
  const staticReading = (skill.resources ?? []).map(r => ({
    label: r.label,
    note: "From curriculum",
    // url intentionally ignored in UI – we don’t render links here
  }));

  return (
    <div className="skill-hub" style={{ "--accent": subject.color } as React.CSSProperties}>
      <h1 className="h1" style={{ textTransform: "capitalize" }}>
        {subject.title} — {skill.title}
      </h1>
      <p className="sub">
        Practical ideas for exploring <strong>{skill.title}</strong> at Year {level.replace(/^y/i, "")}.
      </p>

      <div className="pill-wrap">
        <Link className="topic-pill topic-pill-link" href={`/learn/${params.subject}/${params.skill}`}>
            {skill.title} · {level.toUpperCase()}
        </Link>
    </div>

      <ResourcesPanel
        subject={subject.title}
        subjectSlug={params.subject}
        skillSlug={params.skill}
        skillTitle={skill.title}
        level={level}
        age={age}
        objectives={skill.objectives ?? []}
        staticReading={staticReading}
      />
    </div>
  );
}
