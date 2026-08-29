"use client";

import { useState } from "react";
import { FoodThumb, type FoodIconKey } from "@/components/FoodThumb";
import { RecipeDisclosure } from "./RecipeDisclosure";
import { SubmitButton } from "@/components/SubmitButton";
import { LoadingLink } from "@/components/LoadingLink";
import { logMealEaten } from "./actions";

type Option = {
  title: string; desc: string; calories: number; protein: number; fat: number; carbs: number;
  ingredients: { name: string; qty: string }[]; steps: string[]; icon?: FoodIconKey;
};

export function MealCard({
  options, startIndex, mealType, mealDate, plannedBadge
}: { options: Option[]; startIndex: number; mealType: string; mealDate: string; plannedBadge?: string }) {
  const [index, setIndex] = useState(startIndex);
  const meal = options[index];
  const badge = index === startIndex && plannedBadge ? plannedBadge : "Рецепт под ваш режим";

  return (
    <div className="card" style={{ marginBottom: 16, borderLeft: "5px solid var(--protein)" }}>
      <div className="mealtop" style={{ marginBottom: 12 }}>
        <FoodThumb color="var(--protein)" bg="var(--protein-bg)" icon={meal.icon} alt={meal.title} />
        <div>
          <span className="mealbadge">{badge}</span>
          <h3 style={{ fontSize: 20, marginBottom: 6 }}>{meal.title}</h3>
          <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: 0 }}>{meal.desc}</p>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "0 0 16px" }}>
        {[
          [`${meal.calories} ккал`, "var(--ink-soft)", "var(--paper2)"],
          [`Б ${meal.protein}`, "var(--protein)", "var(--protein-bg)"],
          [`Ж ${meal.fat}`, "var(--fat-ink)", "var(--fat-bg)"],
          [`У ${meal.carbs}`, "var(--carbs)", "var(--carbs-bg)"]
        ].map(([text, color, bg]) => (
          <span key={text} style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 600, color, background: bg, padding: "5px 10px", borderRadius: 999 }}>
            {text}
          </span>
        ))}
      </div>
      <RecipeDisclosure ingredients={meal.ingredients} steps={meal.steps} />
      <div className="actionrow" style={{ marginBottom: 10 }}>
        <form action={logMealEaten} style={{ flex: 1 }}>
          <input type="hidden" name="title" value={meal.title} />
          <input type="hidden" name="mealType" value={mealType} />
          <input type="hidden" name="date" value={mealDate} />
          <input type="hidden" name="ingredients" value={JSON.stringify(meal.ingredients)} />
          <input type="hidden" name="steps" value={JSON.stringify(meal.steps)} />
          {meal.icon && <input type="hidden" name="icon" value={meal.icon} />}
          <input type="hidden" name="calories" value={meal.calories} />
          <input type="hidden" name="protein" value={meal.protein} />
          <input type="hidden" name="fat" value={meal.fat} />
          <input type="hidden" name="carbs" value={meal.carbs} />
          <SubmitButton className="actbtn" pendingText="…">Съел</SubmitButton>
        </form>
        <button
          type="button" className="actbtn ghost"
          onClick={() => setIndex(i => (i + 1) % options.length)}
          disabled={options.length < 2}
        >
          Заменить
        </button>
      </div>
      <LoadingLink
        href="/more" className="btn ghost block"
        style={{ textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
          <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
        </svg>
        Ещё варианты — фото, ресторан, голоден сейчас
      </LoadingLink>
    </div>
  );
}
