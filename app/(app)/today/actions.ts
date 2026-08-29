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

  if (ingredients.length) {
    await supabase.from("grocery_items").insert(
      ingredients.map(i => ({ user_id: user.id, name: i.name, quantity: i.qty, bought: false }))
    );
  }

  revalidatePath("/cart");
  redirect("/cart");
}

export async function setCookingMode(mode: string, mealType?: string, mealDate?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ cooking_mode: mode }).eq("id", user.id);

  // Пользователь явно передумал насчёт времени на готовку — старое запланированное
  // блюдо на этот приём больше не актуально, пусть подберётся заново под новый режим.
  if (mealType && mealDate) {
    await supabase.from("meals")
      .delete()
      .eq("user_id", user.id)
      .eq("date", mealDate)
      .eq("meal_type", mealType)
      .eq("status", "planned");
  }

  revalidatePath("/today");
}

// Копит воду одним рядом на день (а не логом каждого стакана) — читаем текущий
// объём и прибавляем/вычитаем, upsert на unique(user_id, date).
export async function addWater(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const delta = Number(formData.get("amount"));
  const date = formData.get("date") as string;
  if (!date || !Number.isFinite(delta)) return;

  const { data: existing } = await supabase
    .from("water_logs").select("amount_ml").eq("user_id", user.id).eq("date", date).maybeSingle();
  const amount_ml = Math.max(0, (existing?.amount_ml ?? 0) + delta);

  await supabase.from("water_logs").upsert({ user_id: user.id, date, amount_ml }, { onConflict: "user_id,date" });

  revalidatePath("/today");
}

// Отмечает съеденным то, что реально показано (после «Заменить» это может быть уже не
// исходно запланированное блюдо) — удаляет старый план на этот слот, если он был, и
// вставляет новую съеденную запись, вместо условного апдейта только для исходного плана.
export async function logMealEaten(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const title = formData.get("title") as string;
  const mealType = formData.get("mealType") as MealType;
  const date = formData.get("date") as string;
  const ingredients = JSON.parse((formData.get("ingredients") as string) || "[]");
  const steps = JSON.parse((formData.get("steps") as string) || "[]");
  const icon = (formData.get("icon") as string) || null;
  const calories = Number(formData.get("calories"));
  const protein = Number(formData.get("protein"));
  const fat = Number(formData.get("fat"));
  const carbs = Number(formData.get("carbs"));
  const normalizedType = MEAL_SEQUENCE.includes(mealType) ? mealType : "snack";

  if (date) {
    await supabase.from("meals")
      .delete()
      .eq("user_id", user.id)
      .eq("date", date)
      .eq("meal_type", normalizedType)
      .eq("status", "planned");
  }

  await supabase.from("meals").insert({
    user_id: user.id,
    date: date || new Date().toISOString().slice(0, 10),
    meal_type: normalizedType,
    title,
    ingredients,
    steps,
    icon,
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
