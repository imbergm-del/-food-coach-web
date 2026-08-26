import Link from "next/link";
import { FoodThumb } from "@/components/FoodThumb";

const DETECTED = [
  { name: "Курица", qty: "~180 г" },
  { name: "Рис", qty: "~150 г" },
  { name: "Авокадо", qty: "~60 г" },
  { name: "Овощи", qty: "~120 г" }
];

export default function PhotoPage() {
  return (
    <div className="sheet">
      <Link href="/today" className="btn ghost on-sheet" style={{ marginBottom: 16, display: "inline-block" }}>&larr; Назад</Link>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Распознавание фото</div>
      <h1 style={{ fontSize: 22, marginBottom: 16, color: "var(--sheet-text)" }}>Похоже на это</h1>
      <div className="sheet-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <FoodThumb color="var(--protein)" bg="rgba(193,85,60,.18)" size={72} />
        </div>
        {DETECTED.map(d => (
          <div key={d.name} className="listrow" style={{ borderColor: "rgba(255,255,255,.1)" }}>
            <span style={{ color: "var(--sheet-text)" }}>{d.name}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--sheet-muted)" }}>{d.qty}</span>
          </div>
        ))}
        <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--sheet-muted)", margin: "12px 0 0" }}>
          Оценочно: 610 ккал · Б 51 · Ж 21 · У 55
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <Link href="/today" className="btn block" style={{ flex: 1, textAlign: "center" }}>Подтвердить</Link>
        <button className="btn ghost on-sheet" style={{ flex: 1 }}>Изменить</button>
      </div>
    </div>
  );
}
