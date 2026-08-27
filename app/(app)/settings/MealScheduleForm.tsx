"use client";

import { useState, useTransition } from "react";
import { saveMealSchedule } from "../reminders/actions";
import { MEAL_TYPE_LABELS, MEAL_SEQUENCE, type MealSchedule } from "@/lib/mealTypes";

function timeValue(t: { hour: number; minute: number }) {
  return `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;
}

export function MealScheduleForm({ schedule }: { schedule: MealSchedule }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSaved(false);
    setError("");
    startTransition(async () => {
      const result = await saveMealSchedule(formData);
      if (result.ok) setSaved(true);
      else setError(result.error || "Не удалось сохранить. Попробуйте ещё раз.");
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {MEAL_SEQUENCE.map(mealType => (
        <div key={mealType} className="listrow" style={{ padding: "8px 0" }}>
          <span style={{ fontSize: 13.5 }}>{MEAL_TYPE_LABELS[mealType]}</span>
          <input
            name={`${mealType}_time`} type="time" defaultValue={timeValue(schedule[mealType])}
            onChange={() => { setSaved(false); setError(""); }}
            style={{
              border: "1px solid var(--line-strong)", borderRadius: 10, padding: "8px 10px",
              fontFamily: "var(--mono)", fontSize: 14, background: "var(--card)", color: "var(--ink)"
            }}
          />
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
        <button className="btn" type="submit" disabled={pending} style={{ width: "auto" }}>
          {pending ? (
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span className="spinner" /> Сохраняем…
            </span>
          ) : "Сохранить"}
        </button>
        {error && (
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--warn)" }}>{error}</span>
        )}
        {saved && !pending && !error && (
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--carbs)" }}>Сохранено ✓</span>
        )}
      </div>
    </form>
  );
}
