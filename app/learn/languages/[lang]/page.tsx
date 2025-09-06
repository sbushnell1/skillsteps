import Link from "next/link";
import { notFound } from "next/navigation";
import { LANGUAGES, LANGUAGE_SKILLS, type LangCode } from "@/data/languages";
import { SUBJECTS } from "@/data/subjects";

export function generateStaticParams() {
  return LANGUAGES.map((l) => ({ lang: String(l.code) }));
}

export default function LanguageSkills({ params }: { params: { lang: LangCode } }) {
  const lang = LANGUAGES.find((l) => l.code === params.lang);
  if (!lang) return notFound();

  const accent = SUBJECTS.find(s => s.slug === "languages")?.color ?? "#d7e3f6";

  return (
    <div>
      <h1 className="h1">Languages — {lang.name}</h1>
      <p className="sub">
        You’re working at year 6 level. Click <Link href="/settings">here</Link> to change this.
      </p>

      <div className="subject-grid">
        {LANGUAGE_SKILLS.map((skill) => (
          <Link
            key={skill.slug}
            href={`/learn/languages/${lang.code}/${skill.slug}`}
            className="subject-card"
            style={{ background: accent }}         
          >
            <div className="subject-inner">
              <div className="subject-label">{skill.title}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
