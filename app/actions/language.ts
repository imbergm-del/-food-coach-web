"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabaseServer";
import type { Lang } from "@/lib/language";

export async function setLanguage(lang: Lang) {
  cookies().set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.from("profiles").update({ language: lang }).eq("id", user.id);

  revalidatePath("/", "layout");
}
