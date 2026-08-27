"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import { MEALS_BY_MODE } from "@/lib/mealMenu";
import { scaleMealToTarget } from "@/lib/scaleMeal";
import { todayISOInTz } from "@/lib/userTime";

const MAIN_MEALS = ["breakfast", "lunch", "dinner"] as const;

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Заполняет пустые завтрак/обед/ужин от сегодняшнего дня до конца недели
// реальными рецептами с граммовкой (чередуя два режима готовки для разнообразия).
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
  let dayIndex = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1), dayIndex++) {
    const iso = toISODate(d);
    const mode = dayIndex % 2 === 0 ? "5" : "15";
    for (const mealType of MAIN_MEALS) {
      const key = `${iso}|${mealType}`;
      if (existingKeys.has(key)) continue;
      const def = scaleMealToTarget(MEALS_BY_MODE[mode][mealType], mealType, calTarget);
      rows.push({
        user_id: user.id,
        date: iso,
        meal_type: mealType,
        title: def.title,
        ingredients: def.ingredients,
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
