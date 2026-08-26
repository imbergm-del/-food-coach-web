"use client";

import { useState } from "react";

export function RecipeDisclosure({ steps }: { steps: string[] }) {
  const [open, setOpen] = useState(false);
  if (steps.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        type="button"
        className="btn ghost block"
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <span>Рецепт</span>
        <span style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>&#9662;</span>
      </button>
      {open && (
        <ol style={{ margin: "12px 0 0", padding: "0 0 0 20px" }}>
          {steps.map((step, i) => (
            <li key={i} style={{ fontSize: 14.5, color: "var(--ink-soft)", marginBottom: 8, lineHeight: 1.5 }}>
              {step}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
