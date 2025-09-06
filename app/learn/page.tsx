import Link from "next/link";
import SubjectIcon from "../components/SubjectIcon";
import { SUBJECTS } from "@/data/subjects";

export default function LearnHome() {
  return (
    <div>
      <h1 className="h1">Welcome back, Marie!</h1>
      <p className="sub">
        You’re working at year 6 level. Click <Link href="/settings">here</Link> to change this.
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
