// app/learn/[subject]/page.tsx
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { SUBJECTS } from "@/data/subjects";
import { getSkills, type SubjectSlug } from "@/data/curriculum";
import { levelForAge } from "@/data/ages";

export const dynamic = "force-dynamic"; // read cookies each request

export default async function SubjectPage({
  params,
}: { params: Promise<{ subject: SubjectSlug }> }) {
  const { subject: subjectSlug } = await params;

  if (subjectSlug === "languages") redirect("/learn/languages");

  const subject = SUBJECTS.find(s => s.slug === subjectSlug);
  if (!subject) return notFound();

  const hdrs = await headers();
  const cookieHeader = hdrs.get("cookie") ?? "";
  const readCookie = (name: string): string | undefined => {
    const esc = name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${esc}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : undefined;
  };

  const ageStr = readCookie("ss.age");
  const age = ageStr ? Number(ageStr) : 10;
  const level = levelForAge(age); // e.g. "y5" | "y6"

  // Pull skills for this level; graceful fallback to y6 while you build other years
  let skills = getSkills(level, subject.slug);
  if (skills.length === 0) skills = getSkills("y6", subject.slug);

  return (
    <div style={{ "--accent": subject.color } as React.CSSProperties}>
      <h1 className="h1">{subject.title}</h1>
      <p className="sub">
        Age {age} (Year {level.replace(/^y/i, "")}). Click <Link href="/settings">here</Link> to change this.
      </p>

      <div className="skill-grid">
        {skills.map((skill) => (
          <Link
            key={skill.slug}
            href={`/learn/${subject.slug}/${skill.slug}`}
            className="skill-card"
            aria-label={skill.title}
          >
            <div className="skill-inner">
              <div className="skill-label">{skill.title}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
