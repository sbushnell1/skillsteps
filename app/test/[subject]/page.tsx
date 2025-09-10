// app/test/[subject]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { SUBJECTS } from "@/data/subjects";
import { getSkills, type SubjectSlug } from "@/data/curriculum";
import { headers } from "next/headers";
import { levelForAge } from "@/data/ages";

export const dynamic = "force-dynamic";

export default async function TestSubjectPage({ params }: { params: Promise<{ subject: SubjectSlug }> }) {
  const { subject } = await params;
  const subj = SUBJECTS.find(s => s.slug === subject);
  if (!subj || subject === "languages") return notFound();

  const hdrs = await headers();
  const cookieHeader = hdrs.get("cookie") ?? "";
  const m = cookieHeader.match(/(?:^|;\s*)ss\.age=([^;]*)/);
  const age = m ? Number(decodeURIComponent(m[1])) : 10;
  const level = levelForAge(age);

  const skills = getSkills(level, subject);
  return (
    <div>
      <h1 className="h1">Test — {subj.title}</h1>
      <p className="sub">Year {level.replace(/^y/i, "")} · Pick a topic to assess.</p>

      <div className="skill-grid">
        {skills.map(sk => (
          <Link
            key={sk.slug}
            href={`/test/${subject}/${sk.slug}`}
            className="skill-card"
            style={{ background: subj.color }}
          >
            <div className="skill-inner">
              <div className="skill-label">{sk.title}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
