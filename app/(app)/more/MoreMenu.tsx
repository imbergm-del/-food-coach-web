"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FoodThumb } from "@/components/FoodThumb";

type Item = { title: string; desc: string; href: string; color: string; bg: string };

export function MoreMenu({ items }: { items: Item[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);

  function go(href: string) {
    setLoadingHref(href);
    startTransition(() => router.push(href));
  }

  return (
    <>
      {items.map(it => {
        const isLoading = isPending && loadingHref === it.href;
        return (
          <button
            key={it.href}
            type="button"
            onClick={() => go(it.href)}
            disabled={isPending}
            className="sheet-card"
            style={{
              width: "100%", textAlign: "left", border: "none", cursor: "pointer",
              font: "inherit", opacity: isPending && !isLoading ? 0.4 : 1
            }}
          >
            <FoodThumb color={it.color} bg={it.bg} size={44} />
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontWeight: 600, fontSize: 14.5, color: "var(--sheet-text)" }}>{it.title}</span>
              <span style={{ display: "block", fontSize: 12, color: "var(--sheet-muted)", marginTop: 2 }}>{it.desc}</span>
            </span>
            {isLoading && <span className="spinner" style={{ color: "var(--sheet-text)" }} />}
          </button>
        );
      })}
    </>
  );
}
