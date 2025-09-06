// app/learn/[subject]/[skill]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { SUBJECTS } from "@/data/subjects";
import { getSkill, type SubjectSlug } from "@/data/curriculum";
import { levelForAge } from "@/data/ages";

export const dynamic = "force-dynamic";

export default async function SkillPage({
  params,
}: { params: { subject: SubjectSlug; skill: string } }) {
  const subject = SUBJECTS.find((s) => s.slug === params.subject);
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
  const level = levelForAge(age); // "y5" | "y6"

  // Get the level-specific skill; fallback to y6 if this year not populated yet
  let skill = getSkill(level, params.subject, params.skill);
  if (!skill) skill = getSkill("y6", params.subject, params.skill);
  if (!skill) return notFound();

  return (
    <div style={{ "--accent": subject.color } as React.CSSProperties}>
      <h1 className="h1" style={{ textTransform: "capitalize" }}>{params.subject}</h1>
      <p className="sub">
        Age {age} (Year {level.replace(/^y/i, "")}). Topic: <strong>{skill.title}</strong>
      </p>

      <div style={{ display: "grid", placeItems: "center", margin: "12px 0 24px" }}>
        <div className="subject-card" style={{ padding: 12, borderRadius: 999, background: "var(--chip)" }}>
          <strong>{skill.title}</strong>
        </div>
      </div>

      <div className="subject-grid" style={{ "--min": "260px" } as React.CSSProperties}>

        {/* Overview / PDF */}
        <a
          className="subject-card"
          href={skill.pdf ?? "#"}
          target={skill.pdf ? "_blank" : undefined}
          rel="noreferrer"
          aria-disabled={!skill.pdf}
          style={{ opacity: skill.pdf ? 1 : 0.6, pointerEvents: skill.pdf ? "auto" : "none" }}
        >
          <div className="subject-inner">
            <div className="subject-label">Overview</div>
            <div className="sub">View Summary PDF</div>
          </div>
        </a>

        {/* Dive Deeper (AI) */}
        <Link className="subject-card" href={`/learn/${params.subject}/${params.skill}/expand`}>
          <div className="subject-inner">
            <div className="subject-label">Dive Deeper</div>
            <div className="sub">Ask questions about this topic</div>
          </div>
        </Link>

        {/* Practice */}
        <Link className="subject-card" href={`/learn/${params.subject}/${params.skill}/practice`}>
          <div className="subject-inner">
            <div className="subject-label">Practice Questions</div>
            <div className="sub">Test your knowledge!</div>
          </div>
        </Link>

        {/* Resources */}
        <Link className="subject-card" href={`/learn/${params.subject}/${params.skill}/resources`}>
          <div className="subject-inner">
            <div className="subject-label">More Resources</div>
            <div className="sub">Home ideas & downloads</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
