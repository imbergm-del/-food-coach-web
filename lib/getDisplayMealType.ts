import type { SupabaseClient } from "@supabase/supabase-js";
import { MEAL_SEQUENCE, currentMealType, currentMealDate, type MealType, type MealSchedule } from "@/lib/mealTypes";

// Приём, который сейчас показывается как «следующий»: текущий по расписанию, если он ещё
// не отмечен, иначе следующий неотмеченный ПО ПОРЯДКУ ВПЕРЁД от текущего времени (не самый
// ранний пропущенный за день — иначе завтрак, отмеченный на пару часов позже факта, будет
// висеть на экране до самого вечера вместо того, чтобы уступить место обеду/перекусу).
// Через час после ужина date уже завтрашняя.
export async function getDisplayMealType(
  supabase: SupabaseClient, userId: string, timezone?: string | null, schedule?: MealSchedule
): Promise<{ type: MealType | undefined; date: string }> {
  const date = currentMealDate(timezone, schedule);
  const { data: meals } = await supabase
    .from("meals").select("meal_type, status").eq("user_id", userId).eq("date", date);

  const loggedTypes = new Set((meals ?? []).filter(m => m.status !== "planned").map(m => m.meal_type));
  const clockType = currentMealType(timezone, schedule);
  if (!loggedTypes.has(clockType)) return { type: clockType, date };

  const clockIndex = MEAL_SEQUENCE.indexOf(clockType);
  const forward = [...MEAL_SEQUENCE.slice(clockIndex + 1), ...MEAL_SEQUENCE.slice(0, clockIndex + 1)];
  const type = forward.find(t => !loggedTypes.has(t));
  return { type, date };
}
