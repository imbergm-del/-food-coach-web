"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import { currentMealType, getMealSchedule } from "@/lib/mealTypes";
import { todayISOInTz } from "@/lib/userTime";

export async function logPhotoMeal(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, breakfast_time, lunch_time, snack_time, dinner_time")
    .eq("id", user.id).single();

  const title = formData.get("title") as string;
  const ingredients = JSON.parse((formData.get("ingredients") as string) || "[]");
  const calories = Number(formData.get("calories"));
  const protein = Number(formData.get("protein"));
  const fat = Number(formData.get("fat"));
  const carbs = Number(formData.get("carbs"));
  const today = todayISOInTz(profile?.timezone);

  await supabase.from("meals").insert({
    user_id: user.id,
    date: today,
    meal_type: currentMealType(profile?.timezone, getMealSchedule(profile)),
    title,
    ingredients,
    calories,
    protein,
    fat,
    carbs,
    status: "photo_logged",
    source: "photo"
  });

  revalidatePath("/today");
  revalidatePath("/plan");
  redirect("/today");
}
