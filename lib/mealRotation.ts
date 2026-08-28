import type { MealDef } from "@/lib/mealMenu";

// Число дней от условной "эпохи" до календарной даты — стабильно для одной и той
// же даты независимо от часового пояса и от того, когда вызывается функция
// (в отличие от индекса "N дней с сегодня", который сбивается на новой неделе).
function absoluteDayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

// Блюдо на конкретный день из полного набора — при 7 блюдах в пуле гарантированно
// не повторяется ни в одном 7-дневном окне, в какую бы неделю ни планировали.
export function pickMealForDate(pool: MealDef[], date: string): MealDef {
  return pool[absoluteDayIndex(date) % pool.length];
}

// То же самое, но только среди блюд с нужным временем готовки — для «Сегодня»,
// где выбор должен уважать переключатель "Сколько времени есть на еду". Если передан
// текущий час и он вечерний, дополнительно исключает явно завтрачные блюда (например,
// перекус, подбираемый поздним вечером, не должен предлагать тосты с авокадо).
export function pickMealForDateAndMode(pool: MealDef[], date: string, cookingMode: "5" | "15", hour?: number): MealDef {
  const filtered = pool.filter(m => m.cookingMode === cookingMode);
  let usable = filtered.length ? filtered : pool;
  if (hour !== undefined && hour >= 18) {
    const eveningOk = usable.filter(m => !m.notEvening);
    if (eveningOk.length) usable = eveningOk;
  }
  return usable[absoluteDayIndex(date) % usable.length];
}
