function ring(pct: number, color: string, r: number) {
  const c = 2 * Math.PI * r;
  const clamped = Math.min(pct, 1);
  return (
    <circle
      cx="90" cy="90" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
      strokeDasharray={c} strokeDashoffset={c * (1 - clamped)} transform="rotate(-90 90 90)"
    />
  );
}

export function MacroDial({
  proteinPct, fatPct, carbsPct, caloriesLeft
}: { proteinPct: number; fatPct: number; carbsPct: number; caloriesLeft: number }) {
  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <circle cx="90" cy="90" r="78" fill="none" stroke="var(--paper2)" strokeWidth="9" />
      <circle cx="90" cy="90" r="66" fill="none" stroke="var(--paper2)" strokeWidth="9" />
      <circle cx="90" cy="90" r="54" fill="none" stroke="var(--paper2)" strokeWidth="9" />
      {ring(proteinPct, "var(--protein)", 78)}
      {ring(fatPct, "var(--fat)", 66)}
      {ring(carbsPct, "var(--carbs)", 54)}
      <text x="90" y="84" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="24" fill="var(--ink)">{caloriesLeft}</text>
      <text x="90" y="102" textAnchor="middle" fontFamily="Public Sans" fontSize="10.5" fill="var(--ink-soft)">ккал осталось</text>
    </svg>
  );
}
