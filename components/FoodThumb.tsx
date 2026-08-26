export function FoodThumb({ color, bg, size = 52 }: { color: string; bg: string; size?: number }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 14, background: bg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}
    >
      <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6}>
        <circle cx="12" cy="12" r="8.2" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </div>
  );
}
