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
  langName?: string;   // e.g. "German" (only for languages flow)
  langCode?: string;   // e.g. "de"
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

  // Feedback flow
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [pendingNextQ, setPendingNextQ] = useState<string | null>(null);
  const [lastMarked, setLastMarked] = useState<QA | null>(null);

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
      langName: props.langName,
      langCode: props.langCode,
    }),
    [count, difficulty, focusWeaknesses, props]
  );

  useEffect(() => {
    if (started && !awaitingNext) textRef.current?.focus();
  }, [started, index, awaitingNext]);

  const start = async () => {
    setStarted(true);
    setLoading(true);
    setItems([]);
    setIndex(0);
    setScore(0);
    setFinished(false);
    setSummary(null);
    setInput("");
    setAwaitingNext(false);
    setPendingNextQ(null);
    setLastMarked(null);

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
    if (!input.trim() || loading || finished || awaitingNext) return;
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

      // --- Normalise correctness to avoid obvious false negatives ---
      const normalize = (s: unknown) =>
        String(s ?? "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""); // strip accents/diacritics
      
      const asNumber = (s: string) => {
        const m = s.replace(/[^0-9.+\-/*]/g, "").trim();
        return m && !isNaN(Number(m)) ? Number(m) : null;
      };

      let corrected = !!data.correct;
      const ua = answer;
      const caRaw = String(data.correctAnswer ?? "");
      const uaNum = asNumber(ua);
      const caNum = asNumber(caRaw);

      if (!corrected) {
        if (uaNum !== null && caNum !== null && uaNum === caNum) {
          corrected = true;
        } else if (normalize(ua) === normalize(caRaw)) {
          corrected = true;
        }
      }
      // ----------------------------------------------------------------

      // Update this question in the array for history/score
      const marked: QA = {
        ...current,
        userAnswer: answer,
        correct: corrected,
        correctAnswer: caRaw,
        rationale:
          corrected && data.correct === false && !data.rationale
            ? "Nice — that matches the expected answer."
            : data.rationale,
      };
      const nextItems = [...items];
      nextItems[index] = marked;
      setItems(nextItems);

      // Set visible feedback explicitly
      setLastMarked(marked);

      // Score
      setScore((s) => (corrected ? s + 1 : s));
      setInput("");

      if (data.finish) {
        setFinished(true);
        setSummary({ tips: data.tips || undefined });
        setAwaitingNext(false);
        setPendingNextQ(null);
        return;
      }

      // Hold feedback; only advance when learner clicks "Next"
      setPendingNextQ(data.question || "");
      setAwaitingNext(true);
    } catch (e) {
      console.error(e);
      alert("Could not submit answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    if (!awaitingNext || !pendingNextQ) return;
    const current = items[index];
    const nextQ: QA = { n: current.n + 1, question: pendingNextQ };
    setItems((arr) => [...arr, nextQ]);
    setIndex((i) => i + 1);
    setAwaitingNext(false);
    setPendingNextQ(null);
    setLastMarked(null);
    setInput("");
    textRef.current?.focus();
  };

  const reset = () => {
    setStarted(false);
    setItems([]);
    setIndex(0);
    setScore(0);
    setFinished(false);
    setSummary(null);
    setInput("");
    setAwaitingNext(false);
    setPendingNextQ(null);
    setLastMarked(null);
  };

  // Which card to show as feedback? Always the last marked one if present.
  const feedback = lastMarked;

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

          {/* Question */}
          <div className="practice-q">
            <div className="practice-q-title">Question</div>
            <div className="practice-q-body">{items[index]?.question}</div>
          </div>

          {/* Feedback (always show the last marked result, if any) */}
          {feedback && (
            <div className={`practice-mark ${feedback.correct ? "ok" : "nope"}`}>
              {feedback.correct ? "Correct!" : "Not quite."}
              <div className="practice-mark-sub">
                {feedback.correct
                  ? (feedback.rationale || "Nice work!")
                  : (
                    <>
                      The answer should be <strong>{feedback.correctAnswer}</strong>
                      {feedback.rationale ? <> — {feedback.rationale}</> : null}
                    </>
                  )
                }
              </div>
            </div>
          )}

          {/* Answer box OR Next button */}
          {!finished && !awaitingNext && (
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

          {!finished && awaitingNext && (
            <div style={{ marginTop: 10 }}>
              <button className="composer-btn" onClick={goNext} disabled={loading}>
                Next question
              </button>
            </div>
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
