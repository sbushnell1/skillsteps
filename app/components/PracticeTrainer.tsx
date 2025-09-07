"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  subject: string;
  subjectSlug: string;
  skillSlug: string;
  skillTitle: string;
  level: string;   // e.g. "y6"
  age: number;
  objectives: string[];
  weaknesses: string[]; // placeholder; empty for now
};

type QA = {
  n: number;
  question: string;
  userAnswer?: string;
  correctAnswer?: string;
  correct?: boolean;
  rationale?: string;
};

type Difficulty = "warmup" | "standard" | "challenge";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  warmup: "Warm-up",
  standard: "Standard",
  challenge: "Challenge",
};

export default function PracticeTrainer(props: Props) {
  // Config form
  const [count, setCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");
  const [focusWeaknesses, setFocusWeaknesses] = useState<boolean>(false);

  // Run state
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0); // 0-based question index
  const [items, setItems] = useState<QA[]>([]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState<{ tips?: string } | null>(null);

  const textRef = useRef<HTMLInputElement>(null);

  const settings = useMemo(
    () => ({
      total: count,
      difficulty,
      focusWeaknesses,
      subject: props.subject,
      subjectSlug: props.subjectSlug,
      skillSlug: props.skillSlug,
      skillTitle: props.skillTitle,
      level: props.level,
      age: props.age,
      objectives: props.objectives,
      weaknesses: props.weaknesses,
    }),
    [count, difficulty, focusWeaknesses, props]
  );

  useEffect(() => {
    if (started) textRef.current?.focus();
  }, [started, index]);

  const start = async () => {
    setStarted(true);
    setLoading(true);
    setItems([]);
    setIndex(0);
    setScore(0);
    setFinished(false);
    setSummary(null);
    setInput("");

    try {
      const res = await fetch("/api/practice/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "init",
          settings,
          history: [], // none yet
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to start");
      const firstQ: QA = { n: 1, question: data.question };
      setItems([firstQ]);
      setIndex(0);
    } catch (e) {
      console.error(e);
      alert("Could not start practice. Please try again.");
      setStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!input.trim() || loading || finished) return;
    const current = items[index];
    const answer = input.trim();
    setLoading(true);

    try {
      const res = await fetch("/api/practice/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "grade",
          settings,
          last: { n: current.n, question: current.question, userAnswer: answer },
          history: items
            .filter((q) => q.userAnswer !== undefined)
            .map(({ n, question, userAnswer, correct, correctAnswer, rationale }) => ({
              n, question, userAnswer, correct, correctAnswer, rationale,
            })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to grade");

      // Update current with marking
      const marked: QA = {
        ...current,
        userAnswer: answer,
        correct: data.correct,
        correctAnswer: data.correctAnswer,
        rationale: data.rationale,
      };

      const nextItems = [...items];
      nextItems[index] = marked;

      // Update score
      const newScore = data.correct ? score + 1 : score;
      setScore(newScore);
      setItems(nextItems);
      setInput("");

      if (data.finish) {
        setFinished(true);
        setSummary({ tips: data.tips || undefined });
        return;
      }

      // Next question
      const nextQ: QA = { n: current.n + 1, question: data.question };
      setItems([...nextItems, nextQ]);
      setIndex(index + 1);
    } catch (e) {
      console.error(e);
      alert("Could not submit answer. Please try again.");
    } finally {
      setLoading(false);
      textRef.current?.focus();
    }
  };

  const reset = () => {
    setStarted(false);
    setItems([]);
    setIndex(0);
    setScore(0);
    setFinished(false);
    setSummary(null);
    setInput("");
  };

  return (
    <div className="practice-card">
      {!started ? (
        <>
          <div className="practice-row">
            <label className="practice-label">Number of questions</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="practice-input"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={10}>10</option>
            </select>
          </div>

          <div className="practice-row">
            <label className="practice-label">Difficulty</label>
            <div className="practice-seg">
              {(["warmup", "standard", "challenge"] as Difficulty[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`practice-seg-btn ${difficulty === k ? "is-active" : ""}`}
                  onClick={() => setDifficulty(k)}
                >
                  {DIFFICULTY_LABELS[k]}
                </button>
              ))}
            </div>
          </div>

          <div className="practice-row">
            <label className="practice-check">
              <input
                type="checkbox"
                checked={focusWeaknesses}
                onChange={(e) => setFocusWeaknesses(e.target.checked)}
              />
              Focus on my weaknesses (placeholder)
            </label>
          </div>

          <button className="composer-btn" onClick={start} disabled={loading}>
            Start Practice
          </button>
        </>
      ) : (
        <>
          <div className="practice-top">
            <div>Q{items[index]?.n} of {settings.total}</div>
            <div>Score: {score}/{settings.total}</div>
          </div>

          {/* Question & feedback */}
          <div className="practice-q">
            <div className="practice-q-title">Question</div>
            <div className="practice-q-body">{items[index]?.question}</div>
          </div>

          {items[index]?.userAnswer !== undefined && (
            <div className={`practice-mark ${items[index]?.correct ? "ok" : "nope"}`}>
              {items[index]?.correct ? "Correct!" : "Not quite."}
              <div className="practice-mark-sub">
                {items[index]?.correct
                  ? (items[index]?.rationale || "Nice work!")
                  : (
                    <>
                      The answer should be <strong>{items[index]?.correctAnswer}</strong>
                      {items[index]?.rationale ? <> — {items[index]?.rationale}</> : null}
                    </>
                  )
                }
              </div>
            </div>
          )}

          {/* Answer box */}
          {!finished && (
            <form
              className="composer"
              onSubmit={(e) => { e.preventDefault(); submit(); }}
            >
              <input
                ref={textRef}
                className="composer-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer…"
                disabled={loading}
              />
              <button className="composer-btn" type="submit" disabled={loading || !input.trim()}>
                {index + 1 === settings.total ? "Finish" : "Submit"}
              </button>
            </form>
          )}

          {/* Finished summary */}
          {finished && (
            <div className="practice-summary">
              <div className="practice-score">
                Final score: {score} / {settings.total}
              </div>
              {summary?.tips && (
                <div className="practice-tips">
                  <div className="practice-q-title">Tips</div>
                  <p>{summary.tips}</p>
                </div>
              )}
              <div className="practice-actions">
                <button className="chip" onClick={reset}>Try again</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
