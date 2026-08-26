import type { SupabaseClient } from "@supabase/supabase-js";

export async function getNutritionContext(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  const today = new Date().toISOString().slice(0, 10);
  const { data: todaysMeals } = await supabase
    .from("meals").select("*").eq("user_id", userId).eq("date", today).in("status", ["eaten", "photo_logged"]);

  const usedProtein = todaysMeals?.reduce((s, m) => s + (m.protein ?? 0), 0) ?? 0;
  const usedFat = todaysMeals?.reduce((s, m) => s + (m.fat ?? 0), 0) ?? 0;
  const usedCarbs = todaysMeals?.reduce((s, m) => s + (m.carbs ?? 0), 0) ?? 0;
  const usedCals = usedProtein * 4 + usedFat * 9 + usedCarbs * 4;
  const calTarget = profile?.cal_target ?? 2200;

  return {
    profile,
    usedProtein, usedFat, usedCarbs, usedCals,
    calTarget,
    caloriesLeft: Math.max(0, calTarget - usedCals),
    summary:
      `Профиль: ${profile?.name ?? "пользователь"}, ${profile?.age ?? "?"} лет, ${profile?.weight_kg ?? "?"} кг. ` +
      `Дневная норма: ${calTarget} ккал, белок ${profile?.protein_target ?? "?"} г, жиры ${profile?.fat_target ?? "?"} г, углеводы ${profile?.carb_target ?? "?"} г. ` +
      `Уже съедено сегодня: ${usedCals} ккал. Осталось на сегодня: ${Math.max(0, calTarget - usedCals)} ккал.`
  };
}
