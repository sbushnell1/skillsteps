// app/test/page.tsx
import Link from "next/link";
import { SUBJECTS, type Subject } from "@/data/subjects";


export default function TestHome() {
  const nonLang = SUBJECTS.filter(s => s.slug !== "languages");
  return (
    <div>
      <h1 className="h1">Test</h1>
      <p className="sub">Pick a subject to start a 20-question assessment.</p>

      <div className="subject-grid">
        {nonLang.map((s: Subject) => (
          <Link
            key={s.slug}
            href={`/test/${s.slug}`}
            className="subject-card"
            style={{ background: s.color }}
          >
            <div className="subject-inner">
              <div className="subject-label">{s.title}</div>
            </div>
          </Link>
        ))}
      </div>
      <p className="sub" style={{ marginTop: 16 }}>
        For languages, we’ll add a tailored flow next.
      </p>
    </div>
  );
}
