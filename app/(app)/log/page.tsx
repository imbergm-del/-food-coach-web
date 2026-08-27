import { FoodThumb } from "@/components/FoodThumb";
import { LoadingLink } from "@/components/LoadingLink";

export default function LogPage() {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Записать еду</div>
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>Что вы съели?</h1>
      <div className="card" style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 10px" }}>Опишите словами</p>
        <div style={{ border: "1px solid var(--line-strong)", borderRadius: 10, padding: "10px 12px", fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 12 }}>
          2 яйца, тост и капучино
        </div>
        <button className="btn block">Разобрать с ИИ</button>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <LoadingLink href="/photo" className="btn ghost block" style={{ textAlign: "center" }}>Сфотографировать</LoadingLink>
        <button className="btn ghost block">Голосом</button>
      </div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Сегодня записано</div>
      <div className="card">
        <div className="listrow">
          <span style={{ display: "flex", alignItems: "center" }}><FoodThumb color="var(--carbs)" bg="var(--carbs-bg)" size={36} /><span style={{ marginLeft: 10 }}>Завтрак — йогурт с ягодами</span></span>
          <span className="macrolabel">32 г белка</span>
        </div>
        <div className="listrow">
          <span style={{ display: "flex", alignItems: "center" }}><FoodThumb color="var(--protein)" bg="var(--protein-bg)" size={36} /><span style={{ marginLeft: 10 }}>Обед — курица с рисом</span></span>
          <span className="macrolabel">42 г белка</span>
        </div>
      </div>
    </div>
  );
}
