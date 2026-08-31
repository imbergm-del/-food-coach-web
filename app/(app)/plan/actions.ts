"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import { regeneratePlan, PLAN_HORIZON_DAYS } from "@/lib/planGeneration";
import { todayISOInTz } from "@/lib/userTime";
import { getLang } from "@/lib/language";

// Составляет завтрак/обед/ужин на ближайшие 5 дней реальными рецептами с
// граммовкой. Съеденное и выбранное пользователем вручную не трогает, а ещё не
// съеденные автосгенерированные записи пересобирает — так повторное нажатие
// само чинит устаревшие повторы (см. lib/planGeneration.ts).
export async function generateWeekPlan() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase.from("profiles").select("cal_target, timezone").eq("id", user.id).single();
  const todayISO = todayISOInTz(profile?.timezone);

  await regeneratePlan(supabase, user.id, profile?.cal_target ?? 2200, todayISO, PLAN_HORIZON_DAYS, getLang());

  revalidatePath("/plan");
  revalidatePath("/today");
  revalidatePath("/reminders");
}

// Собирает все ингредиенты плана на ближайшие 5 дней в корзину (без дублей).
export async function addWeekIngredientsToCart() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  const todayISO = todayISOInTz(profile?.timezone);
  const endISO = new Date(todayISO);
  endISO.setDate(endISO.getDate() + PLAN_HORIZON_DAYS - 1);

  const { data: meals } = await supabase
    .from("meals")
    .select("ingredients")
    .eq("user_id", user.id)
    .gte("date", todayISO)
    .lte("date", endISO.toISOString().slice(0, 10));

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
    await supabase.from("grocery_items").insert(
      items.map(i => ({ user_id: user.id, name: i.name, quantity: i.qty, bought: false }))
    );
  }

  revalidatePath("/cart");
  redirect("/cart");
}
