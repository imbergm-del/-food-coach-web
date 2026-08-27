"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import { MEAL_SEQUENCE, type MealType } from "@/lib/mealTypes";

export async function addToCart(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const ingredients = JSON.parse((formData.get("ingredients") as string) || "[]") as { name: string; qty: string }[];
  const mealId = formData.get("mealId") as string;

  if (ingredients.length) {
    await supabase.from("cart_items").insert(
      ingredients.map(i => ({
        user_id: user.id,
        name: i.name,
        quantity: i.qty,
        from_meal_id: mealId ? Number(mealId) : null
      }))
    );
  }

  revalidatePath("/cart");
  redirect("/cart");
}

export async function setCookingMode(mode: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ cooking_mode: mode }).eq("id", user.id);
  revalidatePath("/today");
}

export async function logMealEaten(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const mealId = formData.get("mealId") as string;

  if (mealId) {
    // Приём был запланирован заранее (см. «Напоминания») — просто отмечаем его съеденным
    await supabase.from("meals").update({ status: "eaten" }).eq("id", Number(mealId)).eq("user_id", user.id);
    revalidatePath("/today");
    revalidatePath("/plan");
    return;
  }

  const title = formData.get("title") as string;
  const mealType = formData.get("mealType") as MealType;
  const ingredients = JSON.parse((formData.get("ingredients") as string) || "[]");
  const calories = Number(formData.get("calories"));
  const protein = Number(formData.get("protein"));
  const fat = Number(formData.get("fat"));
  const carbs = Number(formData.get("carbs"));
  const date = (formData.get("date") as string) || new Date().toISOString().slice(0, 10);

  await supabase.from("meals").insert({
    user_id: user.id,
    date,
    meal_type: MEAL_SEQUENCE.includes(mealType) ? mealType : "snack",
    title,
    ingredients,
    calories,
    protein,
    fat,
    carbs,
    status: "eaten",
    source: "home"
  });

  revalidatePath("/today");
  revalidatePath("/plan");
}
