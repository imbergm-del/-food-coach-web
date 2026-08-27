export default function Loading() {
  return (
    <div className="shell">
      <div className="screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Загружаем…</p>
      </div>
    </div>
  );
}
