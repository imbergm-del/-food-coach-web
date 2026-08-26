"use client";

import { useTransition } from "react";
import { setCookingMode } from "./actions";

const MODES = [
  { key: "0", label: "0 мин", desc: "Только готовое: курица-гриль, йогурт, консервы — без плиты." },
  { key: "5", label: "5 мин", desc: "Собрать из готовых частей: сборка без варки и жарки." },
  { key: "15", label: "15–20 мин", desc: "Есть время немного приготовить — плита или духовка." }
];

export function CookingModeTabs({ current }: { current: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Сколько времени есть на еду</div>
      <div className="tabs">
        {MODES.map(m => (
          <button
            key={m.key}
            className={`tab ${current === m.key ? "active" : ""}`}
            disabled={isPending}
            onClick={() => startTransition(() => setCookingMode(m.key))}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "-10px 0 16px" }}>
        {MODES.find(m => m.key === current)?.desc}
      </p>
    </div>
  );
}
