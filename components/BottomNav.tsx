"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { NavIcons } from "@/components/NavIcons";

const NAV = [
  { href: "/today", key: "today", label: "Сегодня" },
  { href: "/plan", key: "plan", label: "План" },
  { href: "/log", key: "log", label: "Записать" },
  { href: "/cart", key: "cart", label: "Корзина" },
  { href: "/coach", key: "coach", label: "Коуч" }
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);

  function go(href: string) {
    if (pathname?.startsWith(href)) return;
    setLoadingHref(href);
    startTransition(() => router.push(href));
  }

  return (
    <nav className="bottomnav">
      {NAV.map(item => {
        const active = pathname?.startsWith(item.href);
        const loading = isPending && loadingHref === item.href;
        return (
          <button
            key={item.href}
            type="button"
            onClick={() => go(item.href)}
            disabled={isPending}
            className={`navbtn ${active ? "active" : ""}`}
            style={{ background: "none", border: "none", font: "inherit", opacity: isPending && !loading ? 0.4 : 1 }}
          >
            <span className="navicon">{loading ? <span className="spinner" /> : NavIcons[item.key]}</span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
