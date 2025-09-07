// app/learn/[subject]/[skill]/practice/page.tsx
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SUBJECTS } from "@/data/subjects";
import { getSkill, type SubjectSlug } from "@/data/curriculum";
import { levelForAge } from "@/data/ages";
import PracticeTrainer from "../../../../components/PracticeTrainer";

export const dynamic = "force-dynamic";

export default async function PracticePage({
  params,
}: { params: { subject: SubjectSlug; skill: string } }) {
  const subject = SUBJECTS.find((s) => s.slug === params.subject);
  if (!subject) return notFound();

  const hdrs = await headers();
  const cookieHeader = hdrs.get("cookie") ?? "";
  const ageMatch = cookieHeader.match(/(?:^|;\s*)ss\.age=([^;]*)/);
  const age = ageMatch ? Number(decodeURIComponent(ageMatch[1])) : 10;
  const level = levelForAge(age);

  let skill = getSkill(level, params.subject, params.skill);
  if (!skill) skill = getSkill("y6", params.subject, params.skill);
  if (!skill) return notFound();

  return (
    <div className="skill-hub" style={{ "--accent": subject.color } as React.CSSProperties}>
      <h1 className="h1" style={{ textTransform: "capitalize" }}>
        {subject.title} — {skill.title}
      </h1>
      <p className="sub">
        Practise <strong>{skill.title}</strong> at Year {level.replace(/^y/i, "")}. One question at a time, with instant marking.
      </p>

      <PracticeTrainer
        subject={subject.title}
        subjectSlug={params.subject}
        skillSlug={params.skill}
        skillTitle={skill.title}
        level={level}
        age={age}
        objectives={skill.objectives ?? []}
        // Weaknesses: placeholder for now (wire later)
        weaknesses={[]}
      />
    </div>
  );
}
