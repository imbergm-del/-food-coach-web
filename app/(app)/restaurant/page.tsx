import Link from "next/link";
import { FoodThumb } from "@/components/FoodThumb";

export default function RestaurantPage() {
  return (
    <div className="sheet">
      <Link href="/today" className="btn ghost on-sheet" style={{ marginBottom: 16, display: "inline-block" }}>&larr; Назад</Link>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Режим ресторана</div>
      <h1 style={{ fontSize: 22, marginBottom: 16, color: "var(--sheet-text)" }}>Ем вне дома</h1>
      <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 16 }}>
        {["Итальянская", "Японская", "Стейк-хаус", "Грузинская"].map(c => (
          <span key={c} style={{ background: "rgba(255,255,255,.08)", color: "var(--sheet-muted)", margin: 4, fontFamily: "var(--mono)", fontSize: 10.5, padding: "4px 10px", borderRadius: 999 }}>{c}</span>
        ))}
      </div>
      <div className="sheet-card" style={{ alignItems: "flex-start" }}>
        <FoodThumb color="var(--water)" bg="var(--water-bg)" size={52} />
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Лучший выбор сегодня</div>
          <h3 style={{ fontSize: 16, marginBottom: 6, color: "var(--sheet-text)" }}>Сибас на гриле</h3>
          <p style={{ fontSize: 12.5, color: "var(--sheet-muted)", margin: "0 0 8px" }}>Овощи, картофель, соус отдельно</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--sheet-muted)", margin: 0 }}>650 ккал · Б 48 · Ж 24 · У 50</p>
        </div>
      </div>
    </div>
  );
}
