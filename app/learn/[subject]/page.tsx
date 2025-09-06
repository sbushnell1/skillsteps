// app/learn/[subject]/page.tsx
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { SUBJECTS, type Subject } from "@/data/subjects";
import { getSkills, allSubjectSlugs, type SubjectSlug } from "@/data/curriculum";

const LEVEL = "y6" as const;

// Build pages for all subjects EXCEPT "languages" (handled by its own route)
export function generateStaticParams() {
    return allSubjectSlugs("y6").filter(s => s !== "languages").map(s => ({ subject: s }));
  }

export default function SubjectPage({ params }: { params: { subject: SubjectSlug } }) {
  // If someone hits /learn/languages, send them to the language chooser
  if (params.subject === "languages") {
    redirect("/learn/languages"); // throws; no further code runs
  }

  const subject = SUBJECTS.find((s) => s.slug === params.subject) as Subject | undefined;
  if (!subject) return notFound();

  const skills = getSkills(LEVEL, subject.slug);

  return (
    <div style={{ "--accent": subject.color } as React.CSSProperties}>
      <h1 className="h1">{subject.title}</h1>
      <p className="sub">
        You’re working at year 6 level. Click <Link href="/settings">here</Link> to change this.
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
