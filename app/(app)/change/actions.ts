"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabaseServer";

export async function chooseAlternative(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const mealType = formData.get("mealType") as string;
  const title = formData.get("title") as string;
  const calories = Number(formData.get("calories"));
  const protein = Number(formData.get("protein"));
  const fat = Number(formData.get("fat"));
  const carbs = Number(formData.get("carbs"));
  const ingredients = JSON.parse((formData.get("ingredients") as string) || "[]");
  const today = new Date().toISOString().slice(0, 10);

  // Заменяем текущий (ещё не съеденный) вариант этого приёма на выбранную альтернативу
  await supabase.from("meals")
    .delete()
    .eq("user_id", user.id)
    .eq("date", today)
    .eq("meal_type", mealType)
    .eq("status", "planned");

  await supabase.from("meals").insert({
    user_id: user.id, date: today, meal_type: mealType, title,
    ingredients, calories, protein, fat, carbs, status: "planned", source: "change"
  });

  revalidatePath("/today");
  revalidatePath("/plan");
  redirect("/today");
}
