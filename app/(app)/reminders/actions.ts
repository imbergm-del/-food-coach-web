"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabaseServer";
import { PLAN_MEAL_TYPES } from "@/lib/planGeneration";
import { MEAL_POOL } from "@/lib/mealMenu";
import { pickMealForDate } from "@/lib/mealRotation";
import { scaleMealToTarget } from "@/lib/scaleMeal";
import { todayISOInTz, addDaysISO } from "@/lib/userTime";

export async function setReminderEnabled(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const enabled = formData.get("enabled") === "true";
  await supabase.from("reminder_settings").upsert({ user_id: user.id, enabled });
  revalidatePath("/settings");
}

export async function setMealRemindersEnabled(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const enabled = formData.get("enabled") === "true";
  await supabase.from("reminder_settings").upsert({ user_id: user.id, meal_reminders_enabled: enabled });
  revalidatePath("/settings");
}

export async function savePhoneNumber(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const phone = (formData.get("phone") as string || "").trim();
  await supabase.from("profiles").update({ phone: phone || null }).eq("id", user.id);
  revalidatePath("/settings");
}

export async function saveName(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const name = (formData.get("name") as string || "").trim();
  await supabase.from("profiles").update({ name: name || null }).eq("id", user.id);
  revalidatePath("/settings");
  revalidatePath("/today");
}

export async function saveMealSchedule(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({
    breakfast_time: (formData.get("breakfast_time") as string) || null,
    lunch_time: (formData.get("lunch_time") as string) || null,
    snack_time: (formData.get("snack_time") as string) || null,
    dinner_time: (formData.get("dinner_time") as string) || null
  }).eq("id", user.id);

  revalidatePath("/settings");
  revalidatePath("/today");
}

// Подбирает другие блюда на завтрак/обед/ужин на завтра — каждый раз следующие
// по кругу в подборке под текущий режим готовки, а не то же самое. Никаких форм:
// одна кнопка «Изменить план на завтра».
export async function reshuffleTomorrowPlan() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase.from("profiles").select("cal_target, timezone").eq("id", user.id).single();
  const calTarget = profile?.cal_target ?? 2200;
  const tomorrowISO = addDaysISO(todayISOInTz(profile?.timezone), 1);

  const { data: existing } = await supabase
    .from("meals")
    .select("id, meal_type, title, status")
    .eq("user_id", user.id)
    .eq("date", tomorrowISO)
    .in("meal_type", PLAN_MEAL_TYPES);

  const idsToDelete: number[] = [];
  const rows: Record<string, unknown>[] = [];

  for (const mealType of PLAN_MEAL_TYPES) {
    const current = existing?.find(m => m.meal_type === mealType);
    if (current?.status && current.status !== "planned") continue; // уже отмечено — не трогаем

    const pool = MEAL_POOL[mealType];
    const currentTitle = current?.title ?? pickMealForDate(pool, tomorrowISO).title;
    const index = pool.findIndex(m => m.title === currentTitle);
    const next = pool[index === -1 ? 0 : (index + 1) % pool.length];
    const def = scaleMealToTarget(next, mealType, calTarget);

    if (current) idsToDelete.push(current.id);
    rows.push({
      user_id: user.id, date: tomorrowISO, meal_type: mealType,
      title: def.title, ingredients: def.ingredients, steps: def.steps,
      calories: def.calories, protein: def.protein, fat: def.fat, carbs: def.carbs,
      status: "planned", source: "week_plan"
    });
  }

  if (idsToDelete.length) await supabase.from("meals").delete().in("id", idsToDelete);
  if (rows.length) await supabase.from("meals").insert(rows);

  revalidatePath("/reminders");
  revalidatePath("/plan");
  revalidatePath("/today");
}
