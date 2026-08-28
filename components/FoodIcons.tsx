// Простые line-иконки под конкретные блюда — тот же визуальный язык, что и остальной
// интерфейс (viewBox 24x24, только обводка, strokeWidth ~1.6-1.8), вместо одной общей
// заглушки-мишени для всех карточек еды.
export const FoodIcons = {
  egg: (
    <path d="M12 3c-3 4-6.5 8.5-6.5 12a6.5 6.5 0 0 0 13 0C18.5 11.5 15 7 12 3Z" />
  ),
  oatmeal: (
    <>
      <path d="M4 12h16a8 8 0 0 1-16 0Z" />
      <path d="M9 8c0-1 1.2-1 1.2-2S9 4.8 9 3.8M14 8c0-1 1.2-1 1.2-2S14 4.8 14 3.8" />
    </>
  ),
  yogurt: (
    <>
      <path d="M7 4h10l-1.2 12.5A4 4 0 0 1 11.8 20h-.6a4 4 0 0 1-4-3.5L6 4Z" />
      <path d="M6 4h12" />
    </>
  ),
  pancake: (
    <>
      <ellipse cx="12" cy="8" rx="7" ry="2.2" />
      <ellipse cx="12" cy="12.3" rx="7" ry="2.2" />
      <ellipse cx="12" cy="16.6" rx="7" ry="2.2" />
    </>
  ),
  toast: (
    <>
      <path d="M4 19V10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v9Z" />
      <circle cx="9.5" cy="14.5" r=".6" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="15.5" r=".6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r=".6" fill="currentColor" stroke="none" />
    </>
  ),
  shake: (
    <>
      <path d="M8 4h8l-1.3 15a1.8 1.8 0 0 1-1.8 1.6h-1.8A1.8 1.8 0 0 1 9.3 19L8 4Z" />
      <path d="M13 1.5v5.5" />
      <path d="M9 9h6" />
    </>
  ),
  wrap: (
    <>
      <rect x="3" y="7" width="18" height="10" rx="5" />
      <path d="M9 7v10M15 7v10" />
    </>
  ),
  bowl: (
    <>
      <path d="M3 12h18a9 9 0 0 1-18 0Z" />
      <path d="M8 12c0-1.5 1-2.5 2-2.5M14 12c0-2 1.5-3.5 3-3.5" />
    </>
  ),
  pasta: (
    <>
      <path d="M3 13h18a9 9 0 0 1-18 0Z" />
      <path d="M7 13c1-2 1-4-1-5M11 13c1-2.5.5-5-1.5-6M15 13c1-2 2-3.5 1-6" />
    </>
  ),
  soup: (
    <>
      <path d="M3 12h15a7.5 7.5 0 0 1-15 0Z" />
      <path d="M18 10h2a2 2 0 0 1 0 4h-2" />
      <path d="M9 8c0-1 1-1 1-2s-1-1-1-2" />
    </>
  ),
  salad: (
    <>
      <path d="M4 13h16a8 8 0 0 1-16 0Z" />
      <path d="M12 13c-2.5-2-2.5-5 0-7 1 2 1 5-1 7" />
      <path d="M12 13c1.5-1.5 3.5-1.5 5-.5" />
    </>
  ),
  steak: (
    <>
      <ellipse cx="12" cy="12" rx="8" ry="5.5" />
      <path d="M7 9l2 6M12 8.5l2 7M16 9l1.5 5.5" />
    </>
  ),
  shrimp: (
    <>
      <path d="M5 17c-2-5 0-11 5-13 4-1.5 8 1 8 5 0 5-4 8-9 9" />
      <path d="M9 5.5l-2-2.3M6.7 8l-2.3-1.5" />
    </>
  ),
  fish: (
    <>
      <path d="M2 12c4.5-5 11-6.5 15-3.3L21 12l-4 3.3c-4 3.2-10.5 1.7-15-3.3Z" />
      <circle cx="7" cy="11.2" r=".8" fill="currentColor" stroke="none" />
      <path d="M18 9.5l3-2M18 14.5l3 2" />
    </>
  ),
  bar: (
    <>
      <rect x="6" y="8" width="12" height="8" rx="2" />
      <path d="M4 12h2M18 12h2" />
    </>
  )
} as const;

export type FoodIconKey = keyof typeof FoodIcons;
