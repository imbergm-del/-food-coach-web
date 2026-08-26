"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabaseServer";

export async function setReminderEnabled(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const enabled = formData.get("enabled") === "true";
  await supabase.from("reminder_settings").upsert({ user_id: user.id, enabled });
  revalidatePath("/reminders");
}
