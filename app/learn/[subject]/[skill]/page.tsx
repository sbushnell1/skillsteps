// app/learn/[subject]/[skill]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { SUBJECTS } from "@/data/subjects";
import { getSkill, type SubjectSlug } from "@/data/curriculum";
import { levelForAge } from "@/data/ages";
import React from "react";

export const dynamic = "force-dynamic";

/* --- Tiny inline SVG icon set --- */
function PdfIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" strokeWidth="1.8"/>
      <path d="M14 3v5h5" strokeWidth="1.8"/>
      <path d="M8 14h8M8 17h6M8 11h5" strokeWidth="1.8"/>
    </svg>
  );
}
function ChatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M21 12a7 7 0 0 1-7 7H8l-5 3 1.5-4.5A7 7 0 1 1 21 12z" strokeWidth="1.8" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeLinecap="round" strokeWidth="2.2"/>
    </svg>
  );
}
function QuizIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2.5" strokeWidth="1.8"/>
      <path d="M7 8h6M7 12h10M7 16h8" strokeWidth="1.8"/>
      <path d="M17 8l.6 1.2L19 9.4l-1 1 .2 1.4-1.2-.6-1.2.6.2-1.4-1-1 1.4-.2L17 8z" strokeWidth="1.2"/>
    </svg>
  );
}
function ResourcesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <rect x="5" y="3" width="12" height="16" rx="1.5" strokeWidth="1.8"/>
      <path d="M9 7h6M9 10h6M9 13h5" strokeWidth="1.8"/>
      <path d="M8 19h9a2 2 0 0 0 2-2V7" strokeWidth="1.4"/>
    </svg>
  );
}

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
  const level = levelForAge(age);

  let skill = getSkill(level, params.subject, params.skill);
  if (!skill) skill = getSkill("y6", params.subject, params.skill);
  if (!skill) return notFound();

  // NEW: computed PDF href via streaming route
  const pdfHref = `/pdfs/${level}/${params.subject}/${params.skill}`;

  return (
    <div className="skill-hub" style={{ "--accent": subject.color } as React.CSSProperties}>
      <h1 className="h1" style={{ textTransform: "capitalize" }}>{subject.title}</h1>
      <p className="sub">
        Age {age} (Year {level.replace(/^y/i, "")}). Topic: <strong>{skill.title}</strong>
      </p>

      {/* Topic pill becomes a link back to /learn/[subject] */}
      <div className="pill-wrap">
        <Link className="topic-pill topic-pill-link" href={`/learn/${params.subject}`}>
          {skill.title}
        </Link>
      </div>

      {/* Weakness card (above tiles) */}
      <section className="weakness-card">
        <h2>Your current weaknesses</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce vitae
          nibh ut urna faucibus semper. Maecenas id turpis nec lacus pulvinar
          viverra. Curabitur fermentum, tortor nec volutpat tristique, justo
          urna elementum ipsum, a semper neque justo non lorem.
        </p>
      </section>

      {/* Four option tiles with icons */}
      <div className="tile-grid">
        {/* Overview / PDF — uses the new route */}
        <a
          className="tile"
          href={pdfHref}
          target="_blank"
          rel="noreferrer"
        >
          <div className="tile-title">Overview</div>
          <PdfIcon className="tile-icon" aria-hidden="true" />
          <div className="tile-sub">View Summary PDF</div>
        </a>

        {/* Dive Deeper */}
        <Link className="tile" href={`/learn/${params.subject}/${params.skill}/expand`}>
          <div className="tile-title">Dive Deeper</div>
          <ChatIcon className="tile-icon" aria-hidden="true" />
          <div className="tile-sub">Ask questions about this topic</div>
        </Link>

        {/* Practice */}
        <Link className="tile" href={`/learn/${params.subject}/${params.skill}/practice`}>
          <div className="tile-title">Practice Questions</div>
          <QuizIcon className="tile-icon" aria-hidden="true" />
          <div className="tile-sub">Test your knowledge!</div>
        </Link>

        {/* Resources */}
        <Link className="tile" href={`/learn/${params.subject}/${params.skill}/resources`}>
          <div className="tile-title">More Resources</div>
          <ResourcesIcon className="tile-icon" aria-hidden="true" />
          <div className="tile-sub">Home ideas & downloads</div>
        </Link>
      </div>
    </div>
  );
}
