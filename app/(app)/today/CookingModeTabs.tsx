"use client";

import { useTransition } from "react";
import { setCookingMode } from "./actions";
import { COOKING_MODES, normalizeCookingMode } from "@/lib/cookingMode";

export function CookingModeTabs({
  current, mealType, mealDate
}: { current: string; mealType?: string; mealDate?: string }) {
  const [isPending, startTransition] = useTransition();
  const normalized = normalizeCookingMode(current);

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Сколько времени есть на еду</div>
      <div className="tabs segmented">
        {COOKING_MODES.map(m => (
          <button
            key={m.key}
            className={`tab ${normalized === m.key ? "active" : ""}`}
            disabled={isPending}
            onClick={() => startTransition(() => setCookingMode(m.key, mealType, mealDate))}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "-10px 0 16px" }}>
        {COOKING_MODES.find(m => m.key === normalized)?.desc}
      </p>
    </div>
  );
}
