// app/learn/page.tsx
import Link from "next/link";
import SubjectIcon from "../components/SubjectIcon";
import { SUBJECTS } from "@/data/subjects";
import { headers } from "next/headers";
import { DEFAULT_AGE, levelForAge } from "@/data/ages";

// Always re-read cookies (so Settings changes reflect immediately)
export const revalidate = 0; // or: export const dynamic = "force-dynamic"

export default async function LearnHome() {
  const hdrs = await headers();                       // ← await here
  const cookieHeader = hdrs.get("cookie") ?? "";

  const readCookie = (name: string): string | undefined => {
    const esc = name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${esc}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : undefined;
  };

  const rawName = readCookie("ss.name") ?? "";
  const name = rawName.trim() ? rawName : "there";

  const ageStr = readCookie("ss.age");
  const age = ageStr ? Number(ageStr) : DEFAULT_AGE;
  const level = levelForAge(age);          // e.g. "y6"
  const year = level.replace(/^y/i, "");   // "6"

  return (
    <div>
      <h1 className="h1">Welcome back, {name}!</h1>
      <p className="sub">
        You’re working at <strong>Year {year}</strong> level. Click{" "}
        <Link href="/settings">here</Link> to change this.
      </p>

      <div className="subject-grid">
        {SUBJECTS.map((s) => (
          <Link
            key={s.slug}
            href={`/learn/${s.slug}`}
            className="subject-card"
            style={{ background: s.color }}
            aria-label={s.title}
          >
            <div className="subject-inner">
              <SubjectIcon name={s.icon} />
              <div className="subject-label">{s.title}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
