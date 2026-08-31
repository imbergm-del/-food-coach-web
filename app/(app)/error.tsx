"use client";

import { useEffect, useState } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [en, setEn] = useState(false);

  useEffect(() => {
    console.error("App route error:", error);
    setEn(document.cookie.includes("lang=en"));
  }, [error]);

  return (
    <div style={{ padding: "50vh 4px 0", textAlign: "center", transform: "translateY(-50%)" }}>
      <h1 style={{ fontSize: 21, marginBottom: 8 }}>{en ? "Screen didn't load" : "Экран не открылся"}</h1>
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 22px" }}>
        {en ? "This is usually a temporary glitch — try again." : "Обычно это временный сбой — попробуйте ещё раз."}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button className="btn" onClick={() => reset()}>{en ? "Try again" : "Попробовать снова"}</button>
        <a className="btn ghost" href="/today">{en ? "Go to Today" : "На «Сегодня»"}</a>
      </div>
    </div>
  );
}
