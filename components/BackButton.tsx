"use client";

import { useRouter } from "next/navigation";
import { useTransition, type CSSProperties } from "react";

export function BackButton({
  className = "btn ghost on-sheet", style, href
}: { className?: string; style?: CSSProperties; href?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={className}
      style={style}
      disabled={isPending}
      onClick={() => startTransition(() => (href ? router.push(href) : router.back()))}
    >
      {isPending ? <span className="spinner" style={{ color: "currentColor" }} /> : <>&larr; Назад</>}
    </button>
  );
}
