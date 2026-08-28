import { FoodIcons, type FoodIconKey } from "@/components/FoodIcons";

export type { FoodIconKey };

export function FoodThumb({
  color, bg, size = 60, photoUrl, icon, alt = ""
}: { color: string; bg: string; size?: number; photoUrl?: string; icon?: FoodIconKey | null; alt?: string }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={alt}
        width={size}
        height={size}
        style={{
          width: size, height: size, borderRadius: 16, objectFit: "cover", flexShrink: 0,
          boxShadow: "0 4px 14px -8px rgba(32,43,31,.5)"
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size, height: size, borderRadius: 16, background: bg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}
    >
      <svg
        width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke={color}
        strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      >
        {icon && FoodIcons[icon] ? FoodIcons[icon] : <><circle cx="12" cy="12" r="8.2" /><circle cx="12" cy="12" r="3" /></>}
      </svg>
    </div>
  );
}
