export const COOKING_MODES = [
  { key: "5", label: "5 мин", desc: "Собрать из готовых частей: сборка без варки и жарки." },
  { key: "15", label: "10–15 мин", desc: "Есть время немного приготовить — плита или духовка." }
] as const;

export type CookingMode = (typeof COOKING_MODES)[number]["key"];

// Раньше был ещё режим "0 мин" (только готовое, без сборки) — он дублировал
// «Я голоден сейчас» и был убран. Старые профили с cooking_mode="0" (или
// любым другим неизвестным значением) считаем как "5".
export function normalizeCookingMode(raw: string | null | undefined): CookingMode {
  return raw === "15" ? "15" : "5";
}

export function cookingModeLabel(raw: string | null | undefined): string {
  return COOKING_MODES.find(m => m.key === normalizeCookingMode(raw))!.label;
}
