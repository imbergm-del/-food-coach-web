export function MacroDial({ usedCals, calTarget, caloriesLeft }: { usedCals: number; calTarget: number; caloriesLeft: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = calTarget > 0 ? Math.min(Math.max(usedCals / calTarget, 0), 1) : 0;

  return (
    <div className="ringwrap">
      <svg viewBox="0 0 122 122">
        <circle cx="61" cy="61" r={r} fill="none" stroke="var(--paper2)" strokeWidth="10" />
        <circle
          cx="61" cy="61" r={r} fill="none" stroke="var(--protein)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 61 61)"
        />
      </svg>
      <div className="ringtext">
        <b>{caloriesLeft}</b>
        <span>ккал<br />осталось</span>
      </div>
    </div>
  );
}
