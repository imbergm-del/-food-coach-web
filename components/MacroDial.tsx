function ring(pct: number, color: string, r: number) {
  const c = 2 * Math.PI * r;
  const clamped = Math.min(pct, 1);
  return (
    <circle
      cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
      strokeDasharray={c} strokeDashoffset={c * (1 - clamped)} transform="rotate(-90 100 100)"
    />
  );
}

export function MacroDial({
  proteinPct, fatPct, carbsPct, caloriesLeft
}: { proteinPct: number; fatPct: number; carbsPct: number; caloriesLeft: number }) {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="86" fill="none" stroke="var(--paper2)" strokeWidth="11" />
      <circle cx="100" cy="100" r="73" fill="none" stroke="var(--paper2)" strokeWidth="11" />
      <circle cx="100" cy="100" r="60" fill="none" stroke="var(--paper2)" strokeWidth="11" />
      {ring(proteinPct, "var(--protein)", 86)}
      {ring(fatPct, "var(--fat)", 73)}
      {ring(carbsPct, "var(--carbs)", 60)}
      <text x="100" y="94" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="34" fontWeight="500" fill="var(--ink)">{caloriesLeft}</text>
      <text x="100" y="114" textAnchor="middle" fontFamily="Public Sans" fontSize="11.5" fontWeight="600" letterSpacing="0.04em" fill="var(--ink-soft)">ККАЛ ОСТАЛОСЬ</text>
    </svg>
  );
}
