// app/learn/[subject]/[skill]/expand/page.tsx
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SUBJECTS } from "@/data/subjects";
import { getSkill, type SubjectSlug } from "@/data/curriculum";
import { levelForAge } from "@/data/ages";
import SkillChat from "../../../../components/SkillChat";

export const dynamic = "force-dynamic";

export default async function ExpandPage({
  params,
}: { params: { subject: SubjectSlug; skill: string } }) {
  const subject = SUBJECTS.find((s) => s.slug === params.subject);
  if (!subject) return notFound();

  const hdrs = await headers();
  const cookieHeader = hdrs.get("cookie") ?? "";
  const ageMatch = cookieHeader.match(/(?:^|;\s*)ss\.age=([^;]*)/);
  const age = ageMatch ? Number(decodeURIComponent(ageMatch[1])) : 10;
  const level = levelForAge(age); // e.g. "y6"

  // get level-specific skill (fallback y6)
  let skill = getSkill(level, params.subject, params.skill);
  if (!skill) skill = getSkill("y6", params.subject, params.skill);
  if (!skill) return notFound();

  return (
    <div className="skill-hub" style={{ "--accent": subject.color } as React.CSSProperties}>
      <h1 className="h1" style={{ textTransform: "capitalize" }}>
        {subject.title} — {skill.title}
      </h1>
      <p className="sub">
        This chat explains <strong>{skill.title}</strong> at Year {level.replace(/^y/i, "")} level.
        It gives examples, clearer wording, rules of thumb, and gentle clarifications.
      </p>

      <div className="pill-wrap">
        <div className="topic-pill">{subject.title} · {skill.title} · {level.toUpperCase()}</div>
      </div>

      <SkillChat
        subject={subject.title}
        subjectSlug={params.subject}
        skillSlug={params.skill}
        skillTitle={skill.title}
        level={level}
        age={age}
        pdfUrl={`/pdfs/${level}/${params.subject}/${params.skill}`}
        objectives={skill.objectives ?? []}
      />
    </div>
  );
}
