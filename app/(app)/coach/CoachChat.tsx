"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Что съесть прямо сейчас?",
  "Хочу что-то сладкое, но в рамках нормы",
  "Собери ужин из того, что обычно есть дома"
];

export function CoachChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: text.trim() }];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Что-то пошло не так.");
      } else {
        setMessages([...next, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("Нет связи с сервером. Проверьте интернет и попробуйте снова.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {messages.length === 0 && !error && (
        <div className="card" style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 12px" }}>
            Спросите что-нибудь, учитывая остаток КБЖУ на сегодня:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {STARTERS.map(s => (
              <button key={s} className="btn ghost" style={{ textAlign: "left" }} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((m, i) => (
        <div
          key={i}
          className="card"
          style={{
            marginBottom: 10,
            background: m.role === "user" ? "var(--paper2)" : "var(--card)",
            marginLeft: m.role === "user" ? 32 : 0,
            marginRight: m.role === "user" ? 0 : 32
          }}
        >
          <p style={{ fontSize: 13.5, margin: 0, whiteSpace: "pre-wrap" }}>{m.content}</p>
        </div>
      ))}

      {loading && (
        <div className="card" style={{ marginBottom: 10, marginRight: 32 }}>
          <p style={{ fontSize: 13.5, margin: 0, color: "var(--ink-soft)" }}>Коуч думает…</p>
        </div>
      )}

      {error && (
        <div className="card" style={{ marginBottom: 10, borderColor: "var(--warn)" }}>
          <p style={{ fontSize: 13, margin: 0, color: "var(--warn)" }}>{error}</p>
        </div>
      )}

      <div ref={bottomRef} />

      <form
        onSubmit={e => { e.preventDefault(); send(input); }}
        style={{ display: "flex", gap: 8, position: "sticky", bottom: 8, marginTop: 12 }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Спросите коуча…"
          disabled={loading}
          style={{
            flex: 1, border: "1px solid var(--line-strong)", borderRadius: 999, padding: "11px 16px",
            fontFamily: "var(--sans)", fontSize: 13.5, background: "var(--card)", color: "var(--ink)"
          }}
        />
        <button className="btn" type="submit" disabled={loading || !input.trim()}>Отправить</button>
      </form>
    </div>
  );
}
