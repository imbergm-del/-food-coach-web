"use client";

import { useFormStatus } from "react-dom";
import type { CSSProperties, ReactNode } from "react";

export function SubmitButton({
  children, pendingText = "Секунду…", className = "btn block", style
}: { children: ReactNode; pendingText?: string; className?: string; style?: CSSProperties }) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending} style={style}>
      {pending ? (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span className="spinner" />
          {pendingText}
        </span>
      ) : children}
    </button>
  );
}
