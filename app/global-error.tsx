"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <html lang="ru">
      <body style={{ margin: 0, background: "#EFEEE4", color: "#202B1F", fontFamily: "sans-serif" }}>
        <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}>
          <h1 style={{ fontSize: 21, marginBottom: 8 }}>Приложение не открылось</h1>
          <p style={{ fontSize: 13.5, color: "#5B655A", margin: "0 0 22px" }}>
            Обычно это временный сбой — попробуйте ещё раз.
          </p>
          <button
            onClick={() => reset()}
            style={{
              fontFamily: "sans-serif", fontSize: 15, fontWeight: 600, borderRadius: 999, padding: "13px 20px",
              border: "1px solid #202B1F", background: "#202B1F", color: "#EFEEE4", cursor: "pointer"
            }}
          >
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  );
}
