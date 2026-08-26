import Link from "next/link";
import { FoodThumb } from "@/components/FoodThumb";

const ALTS = [
  { title: "Индейка + картофель", kcal: "505 ккал · Б 46 · Ж 11 · У 52", color: "var(--fat)", bg: "var(--fat-bg)" },
  { title: "Тунец в пите", kcal: "480 ккал · Б 44 · Ж 10 · У 48", color: "var(--water)", bg: "var(--water-bg)" },
  { title: "Боул с греч. йогуртом и белком яиц", kcal: "470 ккал · Б 50 · Ж 8 · У 40", color: "var(--carbs)", bg: "var(--carbs-bg)" }
];

export default function ChangePage() {
  return (
    <div className="sheet">
      <Link href="/today" className="btn ghost on-sheet" style={{ marginBottom: 16, display: "inline-block" }}>&larr; Назад</Link>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Замена блюда</div>
      <h1 style={{ fontSize: 22, marginBottom: 16, color: "var(--sheet-text)" }}>Похожие по КБЖУ варианты</h1>
      {ALTS.map(a => (
        <div key={a.title} className="sheet-card">
          <FoodThumb color={a.color} bg={a.bg} size={48} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15, color: "var(--sheet-text)" }}>{a.title}</h3>
            <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--sheet-muted)", margin: "4px 0 0" }}>{a.kcal}</p>
          </div>
          <Link href="/today" className="btn" style={{ padding: "8px 14px" }}>Выбрать</Link>
        </div>
      ))}
    </div>
  );
}
