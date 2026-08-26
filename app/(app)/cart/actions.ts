"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabaseServer";

export async function removeCartItem(formData: FormData) {
  const supabase = createClient();
  const id = formData.get("id") as string;
  await supabase.from("cart_items").delete().eq("id", id);
  revalidatePath("/cart");
}

export async function checkoutCart() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: cartItems } = await supabase.from("cart_items").select("*").eq("user_id", user.id);
  if (cartItems?.length) {
    await supabase.from("grocery_items").insert(
      cartItems.map(c => ({ user_id: user.id, name: `${c.name} — ${c.quantity}`, status: "need" }))
    );
    await supabase.from("cart_items").delete().eq("user_id", user.id);
  }
  revalidatePath("/cart");
}
