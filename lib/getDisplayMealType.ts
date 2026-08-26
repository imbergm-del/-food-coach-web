import type { SupabaseClient } from "@supabase/supabase-js";
import { MEAL_SEQUENCE, currentMealType, type MealType } from "@/lib/mealTypes";

// Тот же приём, что показывается на «Сегодня»: текущий по времени, если он ещё
// не отмечен, иначе первый неотмеченный по порядку за день.
export async function getDisplayMealType(supabase: SupabaseClient, userId: string): Promise<MealType | undefined> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: meals } = await supabase
    .from("meals").select("meal_type, status").eq("user_id", userId).eq("date", today);

  const loggedTypes = new Set((meals ?? []).filter(m => m.status !== "planned").map(m => m.meal_type));
  const clockType = currentMealType();
  return !loggedTypes.has(clockType) ? clockType : MEAL_SEQUENCE.find(t => !loggedTypes.has(t));
}
