"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabaseServer";
import { DINNER_PROTEINS, DINNER_FATS, type DinnerProtein, type DinnerFat } from "@/lib/mealTypes";
import { todayISOInTz, addDaysISO } from "@/lib/userTime";

export async function setReminderEnabled(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const enabled = formData.get("enabled") === "true";
  await supabase.from("reminder_settings").upsert({ user_id: user.id, enabled });
  revalidatePath("/reminders");
}

export async function setMealRemindersEnabled(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const enabled = formData.get("enabled") === "true";
  await supabase.from("reminder_settings").upsert({ user_id: user.id, meal_reminders_enabled: enabled });
  revalidatePath("/reminders");
}

export async function savePhoneNumber(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const phone = (formData.get("phone") as string || "").trim();
  await supabase.from("profiles").update({ phone: phone || null }).eq("id", user.id);
  revalidatePath("/reminders");
}

export async function saveName(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const name = (formData.get("name") as string || "").trim();
  await supabase.from("profiles").update({ name: name || null }).eq("id", user.id);
  revalidatePath("/reminders");
  revalidatePath("/today");
}

export async function savePlanForTomorrow(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const breakfastNote = (formData.get("breakfastNote") as string || "").trim();
  const lunchNote = (formData.get("lunchNote") as string || "").trim();
  const proteinKey = formData.get("dinnerProtein") as DinnerProtein;
  const fatKey = formData.get("dinnerFat") as DinnerFat;
  const protein = DINNER_PROTEINS[proteinKey] ?? DINNER_PROTEINS.chicken;
  const fatLabel = DINNER_FATS[fatKey] ?? DINNER_FATS.olive_oil;

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  const tomorrowISO = addDaysISO(todayISOInTz(profile?.timezone), 1);

  // Пересохраняем план начисто, чтобы повторное сохранение обновляло, а не дублировало
  await supabase.from("meals")
    .delete()
    .eq("user_id", user.id)
    .eq("date", tomorrowISO)
    .eq("status", "planned")
    .in("meal_type", ["breakfast", "lunch", "dinner"]);

  const rows = [];
  if (breakfastNote) {
    rows.push({
      user_id: user.id, date: tomorrowISO, meal_type: "breakfast",
      title: breakfastNote, ingredients: [], status: "planned", source: "plan"
    });
  }
  if (lunchNote) {
    rows.push({
      user_id: user.id, date: tomorrowISO, meal_type: "lunch",
      title: `Обед: ${lunchNote}`, ingredients: [], status: "planned", source: "plan"
    });
  }
  const dinnerIngredients = [
    { name: `${protein.label} (белок)`, qty: "200 г" },
    { name: "Овощи", qty: "200 г" },
    { name: fatKey === "avocado" ? "Авокадо" : "Оливковое масло", qty: fatKey === "avocado" ? "1 шт" : "1 ст.л." }
  ];
  rows.push({
    user_id: user.id, date: tomorrowISO, meal_type: "dinner",
    title: `${protein.label} с овощами и ${fatLabel}`,
    ingredients: dinnerIngredients,
    calories: protein.calories, protein: protein.protein, fat: protein.fat, carbs: protein.carbs,
    status: "planned", source: "plan"
  });

  await supabase.from("meals").insert(rows);

  // Сразу добавляем ингредиенты ужина в корзину, чтобы было проще их купить заранее
  await supabase.from("cart_items").insert(
    dinnerIngredients.map(i => ({ user_id: user.id, name: i.name, quantity: i.qty }))
  );

  revalidatePath("/reminders");
  revalidatePath("/plan");
  revalidatePath("/today");
  revalidatePath("/cart");
}
