"use client";

import { useState, useTransition } from "react";

export function SavedField({
  action, fieldName, initialValue, placeholder, type = "text"
}: {
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  fieldName: string; initialValue: string; placeholder?: string; type?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSaved(false);
    setError("");
    startTransition(async () => {
      const result = await action(formData);
      if (result.ok) setSaved(true);
      else setError(result.error || "Не удалось сохранить. Попробуйте ещё раз.");
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          name={fieldName} type={type} defaultValue={initialValue} placeholder={placeholder}
          onChange={() => { setSaved(false); setError(""); }}
          style={{
            flex: 1, border: "1px solid var(--line-strong)", borderRadius: 12, padding: "11px 14px",
            fontFamily: type === "tel" ? "var(--mono)" : "var(--sans)", fontSize: 14, background: "var(--card)", color: "var(--ink)"
          }}
        />
        <button className="btn" type="submit" disabled={pending} style={{ width: "auto" }}>
          {pending ? (
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span className="spinner" /> Сохраняем…
            </span>
          ) : "Сохранить"}
        </button>
      </div>
      {error && (
        <span style={{ display: "block", marginTop: 8, fontSize: 13, fontWeight: 600, color: "var(--warn)" }}>
          {error}
        </span>
      )}
      {saved && !pending && !error && (
        <span style={{ display: "block", marginTop: 8, fontSize: 13, fontWeight: 600, color: "var(--carbs)" }}>
          Сохранено ✓
        </span>
      )}
    </form>
  );
}
