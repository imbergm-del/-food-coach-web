"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  return (
    <nav className="bottomnav">
      {NAV.map(item => (
        <Link key={item.href} href={item.href} className={`navbtn ${pathname?.startsWith(item.href) ? "active" : ""}`}>
          <span className="navicon">{NavIcons[item.key]}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
