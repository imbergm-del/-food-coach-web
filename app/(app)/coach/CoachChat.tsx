"use client";

import { useState, useRef, useEffect } from "react";
import { resizeToJpegBase64 } from "@/lib/imageResize";
import { coach as dict, t, type Lang } from "@/lib/i18n";

type Message = { role: "user" | "assistant"; content: string; imagePreview?: string };

export function CoachChat({ lang = "ru" }: { lang?: Lang }) {
  const tr = (key: string) => t(dict, lang, key);
  const STARTERS = [tr("starter1"), tr("starter2"), tr("starter3")];
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachedPhoto, setAttachedPhoto] = useState<{ preview: string; base64: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handlePhotoSelected(file: File | undefined) {
    if (!file) return;
    try {
      const dataUrl = await resizeToJpegBase64(file);
      setAttachedPhoto({ preview: dataUrl, base64: dataUrl.split(",")[1] });
    } catch {
      setError(tr("errPhoto"));
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if ((!trimmed && !attachedPhoto) || loading) return;

    const photo = attachedPhoto;
    const messageText = trimmed || tr("photoDefaultMessage");
    const next = [...messages, { role: "user" as const, content: messageText, imagePreview: photo?.preview }];
    setMessages(next);
    setInput("");
    setAttachedPhoto(null);
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
          imageBase64: photo?.base64,
          imageMediaType: photo ? "image/jpeg" : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? tr("errGeneric"));
      } else {
        setMessages([...next, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError(tr("errNoConnection"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {messages.length === 0 && !error && (
        <div className="card" style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 12px" }}>
            {tr("intro")}
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
          {m.imagePreview && (
            <img src={m.imagePreview} alt="" style={{ width: "100%", borderRadius: 12, marginBottom: 10 }} />
          )}
          <p style={{ fontSize: 13.5, margin: 0, whiteSpace: "pre-wrap" }}>{m.content}</p>
        </div>
      ))}

      {loading && (
        <div className="card" style={{ marginBottom: 10, marginRight: 32 }}>
          <p style={{ fontSize: 13.5, margin: 0, color: "var(--ink-soft)" }}>{tr("thinking")}</p>
        </div>
      )}

      {error && (
        <div className="card" style={{ marginBottom: 10, borderColor: "var(--warn)" }}>
          <p style={{ fontSize: 13, margin: 0, color: "var(--warn)" }}>{error}</p>
        </div>
      )}

      <div ref={bottomRef} />

      {attachedPhoto && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <img src={attachedPhoto.preview} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }} />
          <span style={{ fontSize: 12.5, color: "var(--ink-soft)", flex: 1 }}>{tr("photoAttached")}</span>
          <button type="button" className="btn ghost" style={{ padding: "4px 10px" }} onClick={() => setAttachedPhoto(null)}>×</button>
        </div>
      )}

      <form
        onSubmit={e => { e.preventDefault(); send(input); }}
        style={{ display: "flex", gap: 8, position: "sticky", bottom: 8, marginTop: 12 }}
      >
        <button
          type="button"
          className="btn ghost"
          aria-label={tr("attachPhoto")}
          onClick={() => photoInputRef.current?.click()}
          disabled={loading}
          style={{ padding: "11px 14px" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
            <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
            <circle cx="12" cy="13" r="3.2" />
          </svg>
        </button>
        <input
          ref={photoInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
          onChange={e => handlePhotoSelected(e.target.files?.[0])}
        />
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={attachedPhoto ? tr("inputPlaceholderWithPhoto") : tr("inputPlaceholder")}
          disabled={loading}
          style={{
            flex: 1, border: "1px solid var(--line-strong)", borderRadius: 999, padding: "11px 16px",
            fontFamily: "var(--sans)", fontSize: 13.5, background: "var(--card)", color: "var(--ink)"
          }}
        />
        <button className="btn" type="submit" disabled={loading || (!input.trim() && !attachedPhoto)}>{tr("send")}</button>
      </form>
    </div>
  );
}
