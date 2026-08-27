"use client";

import { useState } from "react";
import { FoodThumb } from "@/components/FoodThumb";
import { SubmitButton } from "@/components/SubmitButton";
import { chooseAlternative } from "./actions";

type Option = {
  title: string; calories: number; protein: number; fat: number; carbs: number;
  ingredients: { name: string; qty: string }[]; steps: string[];
};

export function ChangePicker({
  options, startIndex, mealType, mealDate
}: { options: Option[]; startIndex: number; mealType: string; mealDate: string }) {
  const [index, setIndex] = useState(startIndex);
  const current = options[index];

  return (
    <div className="sheet-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
        <FoodThumb color="var(--protein)" bg="var(--protein-bg)" size={48} />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16, color: "var(--sheet-text)" }}>{current.title}</h3>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--sheet-muted)", margin: "4px 0 0" }}>
            {current.calories} ккал · Б {current.protein} · Ж {current.fat} · У {current.carbs}
          </p>
        </div>
      </div>
      <ul style={{ margin: "0 0 14px", padding: "0 0 0 18px" }}>
        {current.ingredients.map(i => (
          <li key={i.name} style={{ fontSize: 12.5, color: "var(--sheet-muted)", marginBottom: 2 }}>
            {i.name} — {i.qty}
          </li>
        ))}
      </ul>
      {current.steps.length > 0 && (
        <ol style={{ margin: "0 0 14px", padding: "0 0 0 18px" }}>
          {current.steps.map((step, i) => (
            <li key={i} style={{ fontSize: 12.5, color: "var(--sheet-muted)", marginBottom: 4, lineHeight: 1.5 }}>
              {step}
            </li>
          ))}
        </ol>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          className="btn ghost on-sheet"
          style={{ flex: 1 }}
          onClick={() => setIndex(i => (i + 1) % options.length)}
        >
          Заменить
        </button>
        <form action={chooseAlternative} style={{ flex: 1 }}>
          <input type="hidden" name="mealType" value={mealType} />
          <input type="hidden" name="date" value={mealDate} />
          <input type="hidden" name="title" value={current.title} />
          <input type="hidden" name="calories" value={current.calories} />
          <input type="hidden" name="protein" value={current.protein} />
          <input type="hidden" name="fat" value={current.fat} />
          <input type="hidden" name="carbs" value={current.carbs} />
          <input type="hidden" name="ingredients" value={JSON.stringify(current.ingredients)} />
          <input type="hidden" name="steps" value={JSON.stringify(current.steps)} />
          <SubmitButton>Выбрать это блюдо</SubmitButton>
        </form>
      </div>
    </div>
  );
}
