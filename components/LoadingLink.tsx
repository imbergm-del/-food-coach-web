"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode, type CSSProperties } from "react";

export function LoadingLink({
  href, children, className, style, ariaLabel
}: { href: string; children: ReactNode; className?: string; style?: CSSProperties; ariaLabel?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={className}
      style={style}
      aria-label={ariaLabel}
      disabled={isPending}
      onClick={() => startTransition(() => router.push(href))}
    >
      {isPending ? <span className="spinner" style={{ color: "currentColor" }} /> : children}
    </button>
  );
}
