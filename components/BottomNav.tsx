"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { NavIcons } from "@/components/NavIcons";
import { nav as dict, t, type Lang } from "@/lib/i18n";

const NAV = [
  { href: "/today", key: "today" },
  { href: "/plan", key: "plan" },
  { href: "/log", key: "log" },
  { href: "/cart", key: "cart" },
  { href: "/coach", key: "coach" }
] as const;

export function BottomNav({ lang = "ru" }: { lang?: Lang }) {
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
            className={`navbtn ${item.key === "log" ? "mid" : ""} ${active ? "active" : ""}`}
            style={{ background: "none", border: "none", font: "inherit", opacity: isPending && !loading ? 0.4 : 1 }}
          >
            <span className="navicon">{loading ? <span className="spinner" /> : NavIcons[item.key]}</span>
            {t(dict, lang, item.key)}
          </button>
        );
      })}
    </nav>
  );
}
