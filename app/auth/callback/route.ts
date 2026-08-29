import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

const AUTH_TIMEOUT_MS = 30000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("auth timeout")), ms))
  ]);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const supabase = createClient();

  try {
    if (code) {
      await withTimeout(supabase.auth.exchangeCodeForSession(code), AUTH_TIMEOUT_MS);
    }

    const { data: { user } } = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS);
    if (user) {
      const { data: profile, error } = await supabase.from("profiles").select("age").eq("id", user.id).single();
      // Строка в profiles создаётся триггером при регистрации, так что у входящего через
      // Google аккаунта она уже есть — ошибка чтения (гонка сессии сразу после обмена кода,
      // сеть) не должна отправлять на онбординг: отправляем туда только когда явно видим
      // пустой возраст в успешно прочитанной строке.
      if (profile?.age != null || error) return NextResponse.redirect(`${origin}/today`);
    }
  } catch {
    // Supabase не ответил за разумное время — не подвешиваем пользователя на этой
    // странице навсегда, отправляем на /login, где та же ситуация уже обрабатывается.
    return NextResponse.redirect(`${origin}/login`);
  }

  return NextResponse.redirect(`${origin}/onboarding`);
}
