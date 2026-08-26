"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";

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
