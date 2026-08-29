"use client";

import { useState } from "react";
import { logMealEaten } from "../today/actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { Lang } from "@/lib/language";

type Result = {
  title: string; ingredients: { name: string; qty: string }[];
  calories: number; protein: number; fat: number; carbs: number;
};

export function LogTextForm({ mealType, mealDate, lang = "ru" }: { mealType: string; mealDate: string; lang?: Lang }) {
  const en = lang === "en";
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "analyzing" | "result" | "error">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!text.trim()) return;
    setStatus("analyzing");
    setError("");
    try {
      const res = await fetch("/api/log/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (en ? "Couldn't parse the description." : "Не получилось разобрать описание."));
        setStatus("error");
        return;
      }
      setResult(data);
      setStatus("result");
    } catch {
      setError(en ? "Couldn't process the description. Please try again." : "Не получилось обработать описание. Попробуйте ещё раз.");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setResult(null);
    setError("");
  }

  if (status === "result" && result) {
    return (
      <div className="card" style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 16, marginBottom: 10 }}>{result.title}</h3>
        {result.ingredients.map(i => (
          <div key={i.name} className="listrow" style={{ padding: "6px 0" }}>
            <span style={{ fontSize: 13.5 }}>{i.name}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-soft)" }}>{i.qty}</span>
          </div>
        ))}
        <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-soft)", margin: "10px 0 14px" }}>
          {result.calories} {en ? "kcal" : "ккал"} · {en ? "P" : "Б"} {result.protein} · {en ? "F" : "Ж"} {result.fat} · {en ? "C" : "У"} {result.carbs}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <form action={logMealEaten} style={{ flex: 1 }}>
            <input type="hidden" name="title" value={result.title} />
            <input type="hidden" name="mealType" value={mealType} />
            <input type="hidden" name="date" value={mealDate} />
            <input type="hidden" name="ingredients" value={JSON.stringify(result.ingredients)} />
            <input type="hidden" name="calories" value={result.calories} />
            <input type="hidden" name="protein" value={result.protein} />
            <input type="hidden" name="fat" value={result.fat} />
            <input type="hidden" name="carbs" value={result.carbs} />
            <SubmitButton>{en ? "Log it" : "Записать"}</SubmitButton>
          </form>
          <button className="btn ghost" style={{ flex: 1 }} onClick={reset} type="button">{en ? "Cancel" : "Отмена"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 10px" }}>{en ? "Describe it in words" : "Опишите словами"}</p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={en ? "e.g. 2 eggs, toast and a cappuccino" : "Например: 2 яйца, тост и капучино"}
        rows={2}
        style={{
          width: "100%", border: "1px solid var(--line-strong)", borderRadius: 10, padding: "10px 12px",
          fontSize: 13.5, color: "var(--ink)", marginBottom: 12, fontFamily: "var(--sans)", resize: "vertical"
        }}
      />
      {status === "error" && <p style={{ color: "var(--warn)", fontSize: 12.5, margin: "-6px 0 12px" }}>{error}</p>}
      <button className="btn block" onClick={handleAnalyze} disabled={status === "analyzing" || !text.trim()} type="button">
        {status === "analyzing" ? (
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span className="spinner" /> {en ? "Parsing…" : "Разбираем…"}
          </span>
        ) : (en ? "Parse with AI" : "Разобрать с ИИ")}
      </button>
    </div>
  );
}
