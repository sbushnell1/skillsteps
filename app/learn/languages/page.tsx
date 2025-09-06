"use client";
import Link from "next/link";
import { LANGUAGES } from "@/data/languages";
import { SUBJECTS } from "@/data/subjects";
import { useEffect, useState } from "react";

export default function LanguageChooser() {
  const [last, setLast] = useState<string | null>(null);
  useEffect(() => setLast(localStorage.getItem("ss.language")), []);

  const accent = SUBJECTS.find(s => s.slug === "languages")?.color ?? "#d7e3f6";

  return (
    <div>
      <h1 className="h1">Languages</h1>
      <p className="sub">Choose a language to study.</p>

      {last && (
        <p className="sub">
          Continue with <Link href={`/learn/languages/${last}`}>your last language</Link>.
        </p>
      )}

      <div className="subject-grid">
        {LANGUAGES.map((l) => (
          <Link
            key={l.code}
            href={`/learn/languages/${l.code}`}
            className="subject-card"
            style={{ background: accent }}         
            onClick={() => localStorage.setItem("ss.language", l.code)}
          >
            <div className="subject-inner">
              <div style={{ fontSize: 42, lineHeight: 1 }}>{l.flag}</div>
              <div className="subject-label">{l.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
