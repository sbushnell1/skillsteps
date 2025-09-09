// components/ResourcesPanel.tsx
"use client";
import React from "react";

import { useEffect, useMemo, useState } from "react";

type Activity = { title: string; steps: string[] };
type ReadingItem = { label: string; note?: string };

type Props = {
  subject: string;
  subjectSlug: string;
  skillSlug: string;
  skillTitle: string;
  level: string;  // "y6"
  age: number;
  objectives: string[];
  // Optional pre-seeded items from curriculum Skill.resources
  staticReading?: ReadingItem[];
  // Optional for language flavour (future extension)
  langName?: string;
  langCode?: string;
};

type AIResult = {
  tips: string[];
  activities: Activity[];
  readingWatching: ReadingItem[];
  extension: string[];
};

export default function ResourcesPanel(props: Props) {
  const [loading, setLoading] = useState(true);
  const [ai, setAI] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Counts we already have (static)
  const haveCounts = useMemo(() => ({
    tips: 0,
    activities: 0,
    reading: props.staticReading?.length ?? 0,
    extension: 0,
  }), [props.staticReading]);

  useEffect(() => {
    let abort = false;

    async function go() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/resources/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: props.subject,
            skillSlug: props.skillSlug,
            skillTitle: props.skillTitle,
            level: props.level,
            age: props.age,
            objectives: props.objectives,
            have: haveCounts,
            langName: props.langName,
            langCode: props.langCode,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch resources");
        if (!abort) setAI(data as AIResult);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Something went wrong";
        if (!abort) setError(msg);
      } finally {
        if (!abort) setLoading(false);
      }      
    }

    go();
    return () => { abort = true; };
  }, [props.subject, props.skillSlug, props.skillTitle, props.level, props.age, props.objectives, haveCounts, props.langName, props.langCode]);

  // Merge static + AI for reading/watching; others are AI-only for now
  const mergedReading: ReadingItem[] = useMemo(() => {
    const seen = new Set<string>();
    const out: ReadingItem[] = [];
    const push = (r: ReadingItem) => {
      const key = r.label.trim().toLowerCase();
      if (seen.has(key) || !key) return;
      seen.add(key);
      out.push(r);
    };
    (props.staticReading ?? []).forEach(push);
    (ai?.readingWatching ?? []).forEach(push);
    return out.slice(0, 5);
  }, [props.staticReading, ai?.readingWatching]);

  return (
    <div className="chat-card" style={{ marginTop: 10 }}>
      {/* Collapsible sections */}
      <Section title="Quick Tips" defaultOpen>
        {loading && !ai ? <Fade>Loading suggestions…</Fade> : null}
        {error ? <p className="sub">Couldn’t load ideas. Try refresh.</p> : null}
        {ai?.tips?.length ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {ai.tips.map((t, i) => <li key={i} style={{ margin: "6px 0" }}>{t}</li>)}
          </ul>
        ) : !loading && !error ? <p className="sub">No tips yet.</p> : null}
      </Section>

      <Section title="Home Activities" defaultOpen>
        {loading && !ai ? <Fade>Gathering activities…</Fade> : null}
        {ai?.activities?.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {ai.activities.map((a, i) => (
              <div key={i} className="practice-q" style={{ margin: 0 }}>
                <div className="practice-q-title">{a.title}</div>
                <ul style={{ margin: "6px 0 0 0", paddingLeft: 18 }}>
                  {a.steps.map((s, j) => <li key={j} style={{ margin: "4px 0" }}>{s}</li>)}
                </ul>
              </div>
            ))}
          </div>
        ) : !loading && !error ? <p className="sub">No activities yet.</p> : null}
      </Section>

      <Section title="Reading / Watching" defaultOpen>
        {props.staticReading?.length ? (
          <p className="sub" style={{ marginTop: 0 }}>Includes items from your curriculum resources.</p>
        ) : null}
        {loading && !ai ? <Fade>Finding titles…</Fade> : null}
        {mergedReading.length ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {mergedReading.map((r, i) => (
              <li key={i} style={{ margin: "6px 0" }}>
                <strong>{r.label}</strong>
                {r.note ? <> — <span className="sub">{r.note}</span></> : null}
              </li>
            ))}
          </ul>
        ) : !loading && !error ? <p className="sub">No suggestions yet.</p> : null}
      </Section>

      <Section title="Extension Ideas" defaultOpen>
        {loading && !ai ? <Fade>Cooking up stretch ideas…</Fade> : null}
        {ai?.extension?.length ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {ai.extension.map((t, i) => <li key={i} style={{ margin: "6px 0" }}>{t}</li>)}
          </ul>
        ) : !loading && !error ? <p className="sub">No extension ideas yet.</p> : null}
      </Section>

      <p className="sub" style={{ marginTop: 12 }}>
        This advice is generic. Please adjust to suit your child or context or use the Dive Deeper tab for more specific suggestions.
      </p>
    </div>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} style={{ marginBottom: 12, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12 }}>
      <summary style={{ cursor: "pointer", padding: "12px 14px", fontWeight: 800, listStyle: "none" }}>
        {title}
      </summary>
      <div style={{ padding: "0 14px 14px" }}>{children}</div>
    </details>
  );
}

function Fade({ children }: { children: React.ReactNode }) {
  return <div className="typing">{children}</div>;
}
