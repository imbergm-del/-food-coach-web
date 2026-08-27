"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import { MEAL_POOL } from "@/lib/mealMenu";
import { pickMealForDate } from "@/lib/mealRotation";
import { scaleMealToTarget } from "@/lib/scaleMeal";
import { todayISOInTz } from "@/lib/userTime";

const MAIN_MEALS = ["breakfast", "lunch", "dinner"] as const;

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Заполняет пустые завтрак/обед/ужин от сегодняшнего дня до конца недели
// реальными рецептами с граммовкой. Блюдо на каждый день берётся по календарной
// дате из подборки на 7 вариантов — так за любые 7 дней подряд ни один завтрак,
// обед или ужин не повторится, в какую бы неделю план ни составляли.
// Не трогает уже существующие записи — безопасно нажимать повторно.
export async function generateWeekPlan(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase.from("profiles").select("cal_target, timezone").eq("id", user.id).single();
  const calTarget = profile?.cal_target ?? 2200;
  const todayISO = todayISOInTz(profile?.timezone);
  const weekEnd = (formData.get("weekEnd") as string) || todayISO;

  const { data: existing } = await supabase
    .from("meals")
    .select("date, meal_type")
    .eq("user_id", user.id)
    .gte("date", todayISO)
    .lte("date", weekEnd);
  const existingKeys = new Set((existing ?? []).map(m => `${m.date}|${m.meal_type}`));

  const rows: Record<string, unknown>[] = [];
  const start = new Date(todayISO);
  const end = new Date(weekEnd);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = toISODate(d);
    for (const mealType of MAIN_MEALS) {
      const key = `${iso}|${mealType}`;
      if (existingKeys.has(key)) continue;
      const def = scaleMealToTarget(pickMealForDate(MEAL_POOL[mealType], iso), mealType, calTarget);
      rows.push({
        user_id: user.id,
        date: iso,
        meal_type: mealType,
        title: def.title,
        ingredients: def.ingredients,
        steps: def.steps,
        calories: def.calories,
        protein: def.protein,
        fat: def.fat,
        carbs: def.carbs,
        status: "planned",
        source: "week_plan"
      });
    }
  }

  if (rows.length) await supabase.from("meals").insert(rows);

  revalidatePath("/plan");
  revalidatePath("/today");
}

// Собирает все ингредиенты недельного плана в корзину (без дублей).
export async function addWeekIngredientsToCart(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const weekStart = formData.get("weekStart") as string;
  const weekEnd = formData.get("weekEnd") as string;

  const { data: meals } = await supabase
    .from("meals")
    .select("ingredients")
    .eq("user_id", user.id)
    .gte("date", weekStart)
    .lte("date", weekEnd);

  const seen = new Set<string>();
  const items: { name: string; qty: string }[] = [];
  for (const m of meals ?? []) {
    const ingredients = (m.ingredients ?? []) as { name: string; qty: string }[];
    for (const ing of ingredients) {
      const key = `${ing.name}|${ing.qty}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(ing);
    }
  }

  if (items.length) {
    await supabase.from("cart_items").insert(
      items.map(i => ({ user_id: user.id, name: i.name, quantity: i.qty }))
    );
  }

  revalidatePath("/cart");
  redirect("/cart");
}
