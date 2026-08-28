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
    const { data: profile, error } = await supabase.from("profiles").select("age").eq("id", user.id).single();
    // Строка в profiles создаётся триггером при регистрации, так что у входящего через
    // Google аккаунта она уже есть — ошибка чтения (гонка сессии сразу после обмена кода,
    // сеть) не должна отправлять на онбординг: отправляем туда только когда явно видим
    // пустой возраст в успешно прочитанной строке.
    if (profile?.age != null || error) return NextResponse.redirect(`${origin}/today`);
  }

  return NextResponse.redirect(`${origin}/onboarding`);
}
