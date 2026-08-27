"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabaseServer";

export async function removeGroceryItem(formData: FormData) {
  const supabase = createClient();
  const id = formData.get("id") as string;
  await supabase.from("grocery_items").delete().eq("id", id);
  revalidatePath("/cart");
}

export async function setGroceryBought(formData: FormData) {
  const supabase = createClient();
  const id = formData.get("id") as string;
  const bought = formData.get("bought") === "true";
  await supabase.from("grocery_items").update({ bought }).eq("id", id);
  revalidatePath("/cart");
}
