import { getLang } from "@/lib/language";

export default function Loading() {
  const en = getLang() === "en";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 0", gap: 14 }}>
      <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
      <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>{en ? "Loading…" : "Загружаем…"}</p>
    </div>
  );
}
