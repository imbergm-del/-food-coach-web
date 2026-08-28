import type { SupabaseClient } from "@supabase/supabase-js";
import { MEAL_POOL } from "@/lib/mealMenu";
import { pickMealForDate } from "@/lib/mealRotation";
import { scaleMealToTarget } from "@/lib/scaleMeal";
import type { MealType } from "@/lib/mealTypes";

export const PLAN_MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
export const PLAN_HORIZON_DAYS = 5;

export function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + n);
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

type ExistingMeal = { id: number; date: string; meal_type: string; status: string; source: string | null };

function isStaleAutoPlan(m: ExistingMeal) {
  return m.status === "planned" && m.source === "week_plan";
}

function buildRow(userId: string, iso: string, mealType: MealType, calTarget: number) {
  const def = scaleMealToTarget(pickMealForDate(MEAL_POOL[mealType], iso), mealType, calTarget);
  return {
    user_id: userId, date: iso, meal_type: mealType,
    title: def.title, ingredients: def.ingredients, steps: def.steps,
    calories: def.calories, protein: def.protein, fat: def.fat, carbs: def.carbs, icon: def.icon,
    status: "planned", source: "week_plan"
  };
}

// Заполняет только ПУСТЫЕ слоты завтрак/обед/ужин на ближайшие days дней — ничего
// существующего не трогает. Вызывается тихо при открытии «Напоминаний», чтобы план
// на завтра точно был, даже если пользователь ни разу не нажимал «Составить план».
export async function fillMissingPlan(
  supabase: SupabaseClient, userId: string, calTarget: number, startISO: string, days: number = PLAN_HORIZON_DAYS
) {
  const endISO = addDaysISO(startISO, days - 1);
  const { data: existing } = await supabase
    .from("meals").select("date, meal_type")
    .eq("user_id", userId).gte("date", startISO).lte("date", endISO);
  const existingKeys = new Set((existing ?? []).map(m => `${m.date}|${m.meal_type}`));

  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < days; i++) {
    const iso = addDaysISO(startISO, i);
    for (const mealType of PLAN_MEAL_TYPES) {
      if (existingKeys.has(`${iso}|${mealType}`)) continue;
      rows.push(buildRow(userId, iso, mealType, calTarget));
    }
  }
  if (rows.length) {
    const { error } = await supabase.from("meals").insert(rows);
    if (error) console.error("fillMissingPlan insert failed:", error.message);
  }
}

// Пересобирает ещё не съеденные автосгенерированные ("week_plan") записи — вызывается
// явной кнопкой «Составить план», чтобы устаревшие повторы подхватили актуальную
// подборку рецептов. Съеденное и выбранное пользователем вручную не трогает.
export async function regeneratePlan(
  supabase: SupabaseClient, userId: string, calTarget: number, startISO: string, days: number = PLAN_HORIZON_DAYS
) {
  const endISO = addDaysISO(startISO, days - 1);
  const { data: existing } = await supabase
    .from("meals").select("id, date, meal_type, status, source")
    .eq("user_id", userId).gte("date", startISO).lte("date", endISO);

  const settledKeys = new Set((existing ?? []).filter(m => !isStaleAutoPlan(m)).map(m => `${m.date}|${m.meal_type}`));
  const staleIds = (existing ?? []).filter(isStaleAutoPlan).map(m => m.id);
  if (staleIds.length) await supabase.from("meals").delete().in("id", staleIds);

  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < days; i++) {
    const iso = addDaysISO(startISO, i);
    for (const mealType of PLAN_MEAL_TYPES) {
      if (settledKeys.has(`${iso}|${mealType}`)) continue;
      rows.push(buildRow(userId, iso, mealType, calTarget));
    }
  }
  if (rows.length) {
    const { error } = await supabase.from("meals").insert(rows);
    if (error) console.error("regeneratePlan insert failed:", error.message);
  }
}
