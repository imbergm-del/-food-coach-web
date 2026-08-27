"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <div style={{ padding: "50vh 4px 0", textAlign: "center", transform: "translateY(-50%)" }}>
      <h1 style={{ fontSize: 21, marginBottom: 8 }}>Экран не открылся</h1>
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 22px" }}>
        Обычно это временный сбой — попробуйте ещё раз.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button className="btn" onClick={() => reset()}>Попробовать снова</button>
        <a className="btn ghost" href="/today">На «Сегодня»</a>
      </div>
    </div>
  );
}
