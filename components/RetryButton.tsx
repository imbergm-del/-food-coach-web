"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";

export function RetryButton({
  className = "btn ghost on-sheet", children = "Попробовать ещё раз"
}: { className?: string; children?: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={className}
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {isPending ? <span className="spinner" /> : children}
    </button>
  );
}
