"use client";

import { useTransition } from "react";
import { setCookingMode } from "./actions";
import { cookingModes, normalizeCookingMode } from "@/lib/cookingMode";
import type { Lang } from "@/lib/language";

export function CookingModeTabs({
  current, mealType, mealDate, lang = "ru"
}: { current: string; mealType?: string; mealDate?: string; lang?: Lang }) {
  const [isPending, startTransition] = useTransition();
  const normalized = normalizeCookingMode(current);
  const modes = cookingModes(lang);

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>{lang === "en" ? "How much time do you have to eat" : "Сколько времени есть на еду"}</div>
      <div className="tabs segmented">
        {modes.map(m => (
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
        {modes.find(m => m.key === normalized)?.desc}
      </p>
    </div>
  );
}
