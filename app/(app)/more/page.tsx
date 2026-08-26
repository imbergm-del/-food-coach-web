import Link from "next/link";
import { FoodThumb } from "@/components/FoodThumb";

const ITEMS = [
  { title: "Заменить блюдо", desc: "Похожие варианты по КБЖУ", href: "/change", color: "var(--protein)", bg: "var(--protein-bg)" },
  { title: "Сфотографировать еду", desc: "Распознать по фото", href: "/photo", color: "var(--fat)", bg: "var(--fat-bg)" },
  { title: "Я голоден сейчас", desc: "Срочные варианты", href: "/hungry", color: "var(--warn)", bg: "var(--protein-bg)" },
  { title: "Ем вне дома", desc: "Подбор блюда в ресторане", href: "/restaurant", color: "var(--water)", bg: "var(--water-bg)" },
  { title: "Мой холодильник", desc: "Что есть дома", href: "/cart?tab=fridge", color: "var(--carbs)", bg: "var(--carbs-bg)" }
];

export default function MorePage() {
  return (
    <div className="sheet">
      <Link href="/today" className="btn ghost on-sheet" style={{ marginBottom: 16, display: "inline-block" }}>&larr; Назад</Link>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Ещё варианты</div>
      <h1 style={{ fontSize: 22, marginBottom: 16, color: "var(--sheet-text)" }}>Что хотите сделать?</h1>
      {ITEMS.map(it => (
        <Link key={it.href} href={it.href} className="sheet-card" style={{ textDecoration: "none" }}>
          <FoodThumb color={it.color} bg={it.bg} size={44} />
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontWeight: 600, fontSize: 14.5, color: "var(--sheet-text)" }}>{it.title}</span>
            <span style={{ display: "block", fontSize: 12, color: "var(--sheet-muted)", marginTop: 2 }}>{it.desc}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
