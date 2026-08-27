"use client";

import { useRouter } from "next/navigation";
import { useTransition, type CSSProperties } from "react";

export function BackButton({
  className = "btn ghost on-sheet", style
}: { className?: string; style?: CSSProperties }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={className}
      style={style}
      disabled={isPending}
      onClick={() => startTransition(() => router.back())}
    >
      {isPending ? <span className="spinner" style={{ color: "currentColor" }} /> : <>&larr; Назад</>}
    </button>
  );
}
