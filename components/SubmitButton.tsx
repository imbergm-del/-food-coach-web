"use client";

import { useFormStatus } from "react-dom";
import type { CSSProperties, ReactNode } from "react";

export function SubmitButton({
  children, pendingText = "Секунду…", className = "btn block", style, disabled = false
}: { children: ReactNode; pendingText?: string; className?: string; style?: CSSProperties; disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending || disabled} style={style}>
      {pending ? (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span className="spinner" />
          {pendingText}
        </span>
      ) : children}
    </button>
  );
}
