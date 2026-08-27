"use server";

import { createClient } from "@/lib/supabaseServer";

export async function syncTimezone(timezone: string) {
  if (!timezone) return;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  if (profile?.timezone === timezone) return;

  await supabase.from("profiles").update({ timezone }).eq("id", user.id);
}
