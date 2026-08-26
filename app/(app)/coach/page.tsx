export default function CoachPage() {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>ИИ-коуч</div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Чем помочь?</h1>
      <div className="card">
        <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
          Здесь будет чат с LLM, учитывающий остаток КБЖУ — следующий шаг разработки.
        </p>
      </div>
    </div>
  );
}
