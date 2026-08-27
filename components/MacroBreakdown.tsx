"use client";

import { useState } from "react";
import { MacroDial } from "./MacroDial";
import { MEAL_TYPE_LABELS } from "@/lib/mealTypes";

type EatenMeal = {
  id: number;
  meal_type: string;
  title: string | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

export function MacroBreakdown({
  meals, usedCals, calTarget, caloriesLeft
}: { meals: EatenMeal[]; usedCals: number; calTarget: number; caloriesLeft: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Показать, что съедено сегодня"
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        <MacroDial usedCals={usedCals} calTarget={calTarget} caloriesLeft={caloriesLeft} />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(32,43,31,.45)",
            display: "flex", alignItems: "flex-end", zIndex: 50
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card"
            style={{
              width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: "22px 22px 0 0",
              maxHeight: "75vh", overflowY: "auto", paddingBottom: 28
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 16 }}>Съедено сегодня</h3>
              <button type="button" onClick={() => setOpen(false)} className="btn ghost" style={{ padding: "6px 14px" }}>
                Закрыть
              </button>
            </div>

            {meals.length ? (
              meals.map(m => (
                <div key={m.id} className="listrow" style={{ flexDirection: "column", alignItems: "stretch", gap: 4, padding: "8px 0" }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {MEAL_TYPE_LABELS[m.meal_type as keyof typeof MEAL_TYPE_LABELS] ?? m.meal_type} — {m.title ?? "без названия"}
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-soft)" }}>
                    {m.calories ?? 0} ккал · Б{m.protein ?? 0} Ж{m.fat ?? 0} У{m.carbs ?? 0}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>Сегодня пока ничего не отмечено съеденным.</p>
            )}

            <div className="listrow" style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 10, fontWeight: 700 }}>
              <span>Итого</span>
              <span style={{ fontFamily: "var(--mono)" }}>{usedCals} ккал</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
