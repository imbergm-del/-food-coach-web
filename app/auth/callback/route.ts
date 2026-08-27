import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const supabase = createClient();
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("age").eq("id", user.id).single();
    if (profile?.age != null) return NextResponse.redirect(`${origin}/today`);
  }

  return NextResponse.redirect(`${origin}/onboarding`);
}
