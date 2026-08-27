"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";

export async function logPhotoMeal(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const mealType = formData.get("mealType") as string;
  const date = formData.get("date") as string;
  const title = formData.get("title") as string;
  const ingredients = JSON.parse((formData.get("ingredients") as string) || "[]");
  const calories = Number(formData.get("calories"));
  const protein = Number(formData.get("protein"));
  const fat = Number(formData.get("fat"));
  const carbs = Number(formData.get("carbs"));

  // Фото заменяет текущий запланированный приём этого слота, а не добавляется отдельно
  await supabase.from("meals")
    .delete()
    .eq("user_id", user.id)
    .eq("date", date)
    .eq("meal_type", mealType)
    .eq("status", "planned");

  await supabase.from("meals").insert({
    user_id: user.id,
    date,
    meal_type: mealType,
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
