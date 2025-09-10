"use client";

import { useEffect, useRef, useState } from "react";
import React from "react";

type PlanItem = { id: string; title: string; difficulty: "basic" | "intermediate" | "stretch" };

type Props = {
  subjectSlug: string;
  subjectTitle: string;
  skillSlug: string;
  skillTitle: string;
  level: string;
  age: number;
  total?: number; // default 20
};

type Marked = {
  i: number;
  question: string;
  userAnswer: string;
  correct: boolean;
  correctAnswer: string;
};

export default function TestRunner(props: Props) {
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState<string>("");
  const [input, setInput] = useState("");
  const [marks, setMarks] = useState<Marked[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctAnswer: string; rationale: string } | null>(null);
  const [score, setScore] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const total = props.total ?? 20;

  useEffect(() => {
    if (started && !finished) inputRef.current?.focus();
  }, [started, finished, index]);

  const start = async () => {
    setLoading(true);
    setStarted(true);
    setFinished(false);
    setPlan([]);
    setIndex(0);
    setQuestion("");
    setInput("");
    setMarks([]);
    setFeedback(null);
    setScore(0);

    try {
      const res = await fetch("/api/test/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "init",
          level: props.level,
          subject: props.subjectSlug,
          skill: props.skillSlug,
          age: props.age,
          total,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to start test");

      setPlan(data.plan as PlanItem[]);
      setIndex(data.first.index as number);
      setQuestion(String(data.first.question || ""));
    } catch (e) {
      console.error(e);
      alert("Could not start the test. Please try again.");
      setStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!input.trim() || loading || finished) return;
    setLoading(true);
    try {
      const res = await fetch("/api/test/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "grade",
          plan,
          index,
          last: { question, userAnswer: input.trim() },
          history: marks,
          level: props.level,
          subject: props.subjectSlug,
          skill: props.skillSlug,
          age: props.age,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to grade");

      const m: Marked = {
        i: index,
        question,
        userAnswer: input.trim(),
        correct: !!data.correct,
        correctAnswer: String(data.correctAnswer ?? ""),
      };
      setMarks(prev => [...prev, m]);
      setFeedback({ correct: !!data.correct, correctAnswer: m.correctAnswer, rationale: String(data.rationale ?? "") });
      if (data.correct) setScore(s => s + 1);

      if (data.finish) {
        setFinished(true);
      } else {
        setIndex(Number(data.next.index ?? index + 1));
        setQuestion(String(data.next.question || ""));
        setInput("");
      }
    } catch (e) {
      console.error(e);
      alert("Could not submit answer.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStarted(false);
    setFinished(false);
    setPlan([]);
    setIndex(0);
    setQuestion("");
    setInput("");
    setMarks([]);
    setFeedback(null);
    setScore(0);
  };

  return (
    <div className="practice-card">
      {!started ? (
        <>
          <div className="practice-row">
            <div className="practice-label">Questions</div>
            <div>{total}</div>
          </div>
          <button className="composer-btn" onClick={start} disabled={loading}>Start Test</button>
        </>
      ) : (
        <>
          <div className="practice-top">
            <div>Q{index + 1} of {plan.length || total}</div>
            <div>Score: {score}/{plan.length || total}</div>
          </div>

          <div className="practice-q">
            <div className="practice-q-title">Question</div>
            <div className="practice-q-body">{question}</div>
          </div>

          {feedback && (
            <div className={`practice-mark ${feedback.correct ? "ok" : "nope"}`}>
              {feedback.correct ? "Correct!" : "Not quite."}
              <div className="practice-mark-sub">
                {feedback.correct ? (feedback.rationale || "Nice work!") : (
                  <>The answer should be <strong>{feedback.correctAnswer}</strong>{feedback.rationale ? ` — ${feedback.rationale}` : ""}</>
                )}
              </div>
            </div>
          )}

          {!finished ? (
            <form
              className="composer"
              onSubmit={(e) => { e.preventDefault(); submit(); }}
            >
              <input
                ref={inputRef}
                className="composer-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer…"
                disabled={loading}
              />
              <button className="composer-btn" type="submit" disabled={loading || !input.trim()}>
                {index + 1 === (plan.length || total) ? "Finish" : "Submit"}
              </button>
            </form>
          ) : (
            <div className="practice-summary">
              <div className="practice-score">Final score: {score} / {plan.length || total}</div>
              <div className="practice-actions">
                <button className="chip" onClick={reset}>Take again</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
