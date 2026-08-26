import Link from "next/link";
import { FoodThumb } from "@/components/FoodThumb";

const OPTIONS = [
  { title: "Дома", desc: "Греч. йогурт + творог, без готовки.", color: "var(--carbs)", bg: "var(--carbs-bg)" },
  { title: "Купить рядом", desc: "Готовая курица-гриль и салат.", color: "var(--fat)", bg: "var(--fat-bg)" },
  { title: "Заказать", desc: "Боул с курицей и рисом, похожий по КБЖУ.", color: "var(--protein)", bg: "var(--protein-bg)" }
];

export default function HungryPage() {
  return (
    <div className="sheet">
      <Link href="/today" className="btn ghost on-sheet" style={{ marginBottom: 16, display: "inline-block" }}>&larr; Назад</Link>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Срочный режим</div>
      <h1 style={{ fontSize: 22, marginBottom: 18, color: "var(--sheet-text)" }}>Я голоден сейчас</h1>
      {OPTIONS.map((o, i) => (
        <div key={o.title} className="sheet-card">
          <FoodThumb color={o.color} bg={o.bg} size={48} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15, color: "var(--sheet-text)", marginBottom: 4 }}>{o.title}</h3>
            <p style={{ fontSize: 12.5, color: "var(--sheet-muted)", margin: 0 }}>{o.desc}</p>
            {i === 2 && <Link href="/cart" className="btn" style={{ marginTop: 10, padding: "8px 14px", display: "inline-block" }}>Заказать продукты</Link>}
          </div>
        </div>
      ))}
    </div>
  );
}
