// components/SkillChat.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  subject: string;
  subjectSlug: string;
  skillSlug: string;
  skillTitle: string;
  level: string;      // "y6"
  age: number;        // 10
  pdfUrl: string;
  objectives: string[];
};

type Msg = { role: "user" | "assistant" | "system"; content: string };

const STARTERS = [
  "Explain in a super simple way",
  "Show me another example",
  "Explain this differently",
  "What’s a quick rule of thumb?",
  "Why is this important?",
  "What’s a common mistake?",
  "Tell me a fun fact about this",
];

export default function SkillChat(props: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        `Hi! I’m here to help with **${props.skillTitle}** at Year ${props.level.replace(/^y/i, "")}. ` +
        `Ask me to explain something, show an example, or say it in a different way. ` +
        `If you’d like, you can also peek at the summary PDF.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: props.subject,
          subjectSlug: props.subjectSlug,
          skillSlug: props.skillSlug,
          skillTitle: props.skillTitle,
          level: props.level,
          age: props.age,
          objectives: props.objectives,
          pdfUrl: props.pdfUrl,
          messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const assistant: Msg = { role: "assistant", content: data.reply ?? "Sorry, I’m not sure." };
      setMessages((m) => [...m, assistant]);
    } catch (e: unknown) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "Hmm, I couldn't reach the helper just now. Please try again in a moment.",
          },
        ]);
        // safe logging without assuming shape
        console.error(e);
      } finally {
      
      setLoading(false);
    }
  };

  return (
    <div className="chat-card">
      <div className="chat-scope">
        <span className="scope-dot" /> {props.subject} · {props.skillTitle} · {props.level.toUpperCase()}
        <a className="scope-link" href={props.pdfUrl} target="_blank" rel="noreferrer">Open summary PDF</a>
      </div>

      {/* Starter prompt chips */}
      <div className="chip-row">
        {STARTERS.map((s) => (
          <button key={s} className="chip" onClick={() => send(s)} disabled={loading}>
            {s}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div className="chat-scroll" ref={scrollerRef}>
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role === "user" ? "bubble-user" : "bubble-assistant"}`}>
            <div className="bubble-inner" dangerouslySetInnerHTML={{ __html: mdToHtml(m.content) }} />
          </div>
        ))}
        {loading && <div className="typing">Thinking…</div>}
      </div>

      {/* Composer */}
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="composer-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${props.skillTitle}…`}
          disabled={loading}
        />
        <button className="composer-btn" type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

/** ultra-light markdown (bold + code + line breaks) for kid-friendly formatting */
function mdToHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}
