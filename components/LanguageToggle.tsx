"use client";

import { useTransition } from "react";
import { setLanguage } from "@/app/actions/language";
import type { Lang } from "@/lib/language";

export function LanguageToggle({ current, style }: { current: Lang; style?: React.CSSProperties }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div style={{ display: "inline-flex", gap: 4, ...style }}>
      {(["ru", "en"] as const).map(l => (
        <button
          key={l} type="button" disabled={isPending}
          onClick={() => startTransition(() => { setLanguage(l); })}
          className={`tab ${current === l ? "active" : ""}`}
          style={{ padding: "6px 12px", fontSize: 11.5, minWidth: 0 }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
