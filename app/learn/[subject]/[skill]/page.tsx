import Link from "next/link";
import { notFound } from "next/navigation";
import { getSkill, allSkillParams, type SubjectSlug } from "@/data/curriculum";

const LEVEL = "y6" as const;

export function generateStaticParams() {
  return allSkillParams(LEVEL).map(({ subject, skill }) => ({ subject, skill }));
}

export default function SkillPage({ params }: { params: { subject: SubjectSlug; skill: string } }) {
  const skill = getSkill(LEVEL, params.subject, params.skill);
  if (!skill) return notFound();

  return (
    <div>
      <h1 className="h1" style={{ textTransform: "capitalize" }}>{params.subject}</h1>
      <p className="sub">You’re working at year 6 level. Click <Link href="/settings">here</Link> to change this.</p>

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
