"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";

function currentMealType() {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 19) return "snack";
  return "dinner";
}

export async function logPhotoMeal(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const title = formData.get("title") as string;
  const ingredients = JSON.parse((formData.get("ingredients") as string) || "[]");
  const calories = Number(formData.get("calories"));
  const protein = Number(formData.get("protein"));
  const fat = Number(formData.get("fat"));
  const carbs = Number(formData.get("carbs"));
  const today = new Date().toISOString().slice(0, 10);

  await supabase.from("meals").insert({
    user_id: user.id,
    date: today,
    meal_type: currentMealType(),
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
