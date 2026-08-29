"use client";

import { useState } from "react";
import { MacroDial } from "./MacroDial";
import { FoodThumb, type FoodIconKey } from "./FoodThumb";
import { LoadingLink } from "./LoadingLink";
import { mealTypeLabel } from "@/lib/mealTypes";
import type { Lang } from "@/lib/language";

type EatenMeal = {
  id: number;
  meal_type: string;
  title: string | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  icon?: FoodIconKey | null;
};

function MacroPill({ label, value, bg, color }: { label: string; value: number; bg: string; color: string }) {
  return (
    <span style={{
      fontFamily: "var(--mono)", fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 999,
      background: bg, color
    }}>
      {label}{value}
    </span>
  );
}

export function MacroBreakdown({
  meals, usedCals, usedProtein, usedFat, usedCarbs, calTarget, proteinTarget, fatTarget, carbTarget, caloriesLeft, lang = "ru"
}: {
  meals: EatenMeal[]; usedCals: number; usedProtein: number; usedFat: number; usedCarbs: number;
  calTarget: number; proteinTarget: number; fatTarget: number; carbTarget: number; caloriesLeft: number; lang?: Lang;
}) {
  const [open, setOpen] = useState(false);
  const en = lang === "en";
  const kcal = en ? "kcal" : "ккал";
  const g = en ? "g" : "г";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={en ? "Show what you ate today" : "Показать, что съедено сегодня"}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%", textAlign: "left" }}
      >
        <div className="ringcard">
          <MacroDial usedCals={usedCals} calTarget={calTarget} caloriesLeft={caloriesLeft} />
          <div className="macrorows">
            {([
              [en ? "Protein" : "Белки", usedProtein, proteinTarget, "protein"],
              [en ? "Fat" : "Жиры", usedFat, fatTarget, "fat"],
              [en ? "Carbs" : "Углеводы", usedCarbs, carbTarget, "carbs"]
            ] as [string, number, number, string][]).map(([label, used, target, colorClass]) => (
              <div key={label}>
                <div className="macrolabel"><span>{label}</span><span><b style={{ color: "var(--ink)" }}>{used}</b>&nbsp;/&nbsp;{target} {g}</span></div>
                <div className="bar">
                  <div style={{ width: `${Math.min(100, target > 0 ? (used / target) * 100 : 0)}%`, background: `var(--${colorClass})` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)"
        }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-soft)" }}>{en ? "What you ate today" : "Что вы сегодня съели"}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth={2}><path d="M9 6l6 6-6 6" /></svg>
        </div>
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
              maxHeight: "80vh", overflowY: "auto", paddingBottom: 24
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--line-strong)", margin: "-4px auto 16px" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div className="eyebrow">{en ? "Eaten today" : "Съедено сегодня"}</div>
              <button type="button" onClick={() => setOpen(false)} className="btn ghost" style={{ padding: "6px 14px" }}>
                {en ? "Close" : "Закрыть"}
              </button>
            </div>
            <LoadingLink href="/reports" className="eyebrow" style={{ display: "inline-block", color: "var(--protein)", marginBottom: 14 }}>
              {en ? "Weekly stats ›" : "Статистика за неделю ›"}
            </LoadingLink>
            <h3 style={{ fontSize: 20, marginBottom: 16 }}>{usedCals} {kcal}</h3>

            <div className="goalgrid">
              <div className="goalcell cal"><b>{usedCals}</b><span>{kcal}</span></div>
              <div className="goalcell protein"><b>{usedProtein}</b><span>{en ? "protein" : "белок"}</span></div>
              <div className="goalcell fat"><b>{usedFat}</b><span>{en ? "fat" : "жиры"}</span></div>
              <div className="goalcell carbs"><b>{usedCarbs}</b><span>{en ? "carbs" : "углев."}</span></div>
            </div>

            {meals.length ? (
              meals.map(m => (
                <div key={m.id} className="card" style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, marginBottom: 10, boxShadow: "none", border: "1px solid var(--line)" }}>
                  <FoodThumb color="var(--protein)" bg="var(--protein-bg)" size={44} icon={m.icon} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="eyebrow" style={{ marginBottom: 2 }}>
                      {mealTypeLabel(m.meal_type as Parameters<typeof mealTypeLabel>[0], lang)}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.title ?? (en ? "Untitled" : "без названия")}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-soft)", marginRight: 2 }}>
                        {m.calories ?? 0} {kcal}
                      </span>
                      <MacroPill label={en ? "P" : "Б"} value={m.protein ?? 0} bg="var(--protein-bg)" color="var(--protein)" />
                      <MacroPill label={en ? "F" : "Ж"} value={m.fat ?? 0} bg="var(--fat-bg)" color="var(--fat-ink)" />
                      <MacroPill label={en ? "C" : "У"} value={m.carbs ?? 0} bg="var(--carbs-bg)" color="var(--carbs)" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>{en ? "Nothing logged as eaten yet today." : "Сегодня пока ничего не отмечено съеденным."}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
