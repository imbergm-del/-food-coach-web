import type { SupabaseClient } from "@supabase/supabase-js";
import { MEAL_SEQUENCE, currentMealType, currentMealDate, type MealType, type MealSchedule } from "@/lib/mealTypes";

// Приём, который сейчас показывается как «следующий»: текущий по расписанию, если он ещё
// не отмечен, иначе первый неотмеченный по порядку. Через час после ужина date уже завтрашняя.
export async function getDisplayMealType(
  supabase: SupabaseClient, userId: string, timezone?: string | null, schedule?: MealSchedule
): Promise<{ type: MealType | undefined; date: string }> {
  const date = currentMealDate(timezone, schedule);
  const { data: meals } = await supabase
    .from("meals").select("meal_type, status").eq("user_id", userId).eq("date", date);

  const loggedTypes = new Set((meals ?? []).filter(m => m.status !== "planned").map(m => m.meal_type));
  const clockType = currentMealType(timezone, schedule);
  const type = !loggedTypes.has(clockType) ? clockType : MEAL_SEQUENCE.find(t => !loggedTypes.has(t));
  return { type, date };
}
