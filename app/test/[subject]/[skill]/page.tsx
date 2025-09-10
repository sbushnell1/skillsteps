// app/test/[subject]/[skill]/page.tsx
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SUBJECTS } from "@/data/subjects";
import { getSkill, type SubjectSlug } from "@/data/curriculum";
import { levelForAge } from "@/data/ages";
import TestRunner from "../../../components/TestRunner";

export const dynamic = "force-dynamic";

export default async function TestSkillPage({ params }: { params: Promise<{ subject: SubjectSlug; skill: string }> }) {
  const { subject, skill } = await params;
  const subj = SUBJECTS.find(s => s.slug === subject);
  if (!subj) return notFound();

  const hdrs = await headers();
  const cookieHeader = hdrs.get("cookie") ?? "";
  const m = cookieHeader.match(/(?:^|;\s*)ss\.age=([^;]*)/);
  const age = m ? Number(decodeURIComponent(m[1])) : 10;
  const level = levelForAge(age);

  let sk = getSkill(level, subject, skill);
  if (!sk) sk = getSkill("y6", subject, skill);
  if (!sk) return notFound();

  return (
    <div className="skill-hub" style={{ "--accent": subj.color } as React.CSSProperties}>
      <h1 className="h1">Test — {subj.title} · {sk.title}</h1>
      <p className="sub">20 questions covering core and stretch objectives. Instant marking; score at the end.</p>

      <TestRunner
        subjectSlug={subject}
        subjectTitle={subj.title}
        skillSlug={sk.slug}
        skillTitle={sk.title}
        level={level}
        age={age}
        total={20}
      />
    </div>
  );
}
