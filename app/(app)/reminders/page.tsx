export default function RemindersPage() {
  const picks = [
    { label: "Завтрак", title: "Творог, ягоды" },
    { label: "Обед", title: "Курица, салат" },
    { label: "Ужин", title: "Стейк, овощи" }
  ];
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Придёт сегодня в 20:00</div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Ваше питание на завтра</h1>
      <div className="card" style={{ marginBottom: 16 }}>
        {picks.map(p => (
          <div key={p.label} className="listrow">
            <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-soft)", width: 70 }}>{p.label}</span>
            <span style={{ flex: 1, textAlign: "right" }}>{p.title}</span>
          </div>
        ))}
      </div>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: 15 }}>Присылать напоминание</h3>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 0" }}>Накануне вечером, в 20:00</p>
        </div>
        <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
      </div>
    </div>
  );
}
