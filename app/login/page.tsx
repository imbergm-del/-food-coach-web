"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

function friendlyAuthError(message: string) {
  if (message === "Email not confirmed") return "Please confirm your email before next step.";
  if (message === "Invalid login credentials") return "Неверный email или пароль.";
  if (message === "User already registered") return "Этот email уже зарегистрирован — попробуйте войти.";
  if (message === "auth timeout") return "Сервис входа сейчас отвечает медленно. Попробуйте ещё раз через минуту.";
  return message;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("auth timeout")), ms))
  ]);
}

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Заполните email и пароль.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const { error } = await withTimeout(
        mode === "login"
          ? supabase.auth.signInWithPassword({ email, password })
          : supabase.auth.signUp({ email, password }),
        30000
      );

      if (error) {
        setError(friendlyAuthError(error.message));
        return;
      }

      const { data: { user } } = await withTimeout(supabase.auth.getUser(), 30000);
      const { data: profile, error: profileError } = user
        ? await supabase.from("profiles").select("age").eq("id", user.id).single()
        : { data: null, error: null };

      // "login" на существующий аккаунт всегда имеет строку в profiles (её создаёт триггер
      // при регистрации) — если запрос не удался (гонка сессии сразу после входа, сеть),
      // это не значит, что анкета не заполнена. Не отправляем на онбординг вслепую, только
      // когда реально видим пустой возраст в успешно прочитанной строке.
      if (mode === "login" && profileError) {
        router.push("/today");
      } else {
        router.push(profile?.age == null ? "/onboarding" : "/today");
      }
      router.refresh();
    } catch (e) {
      setError(friendlyAuthError(e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  }

  return (
    <div className="shell">
      <div className="screen" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--protein-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--protein)" strokeWidth={1.6}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3" /></svg>
        </div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>AI Food Coach</div>
        <h1 style={{ fontSize: 26, marginBottom: 24 }}>
          {mode === "login" ? "С возвращением" : "Создать аккаунт"}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p style={{ color: "var(--warn)", fontSize: 13.5, fontWeight: 700, marginTop: -8, marginBottom: 14 }}>{error}</p>}
          <button className="btn block" type="submit" disabled={loading}>
            {loading ? "Секунду…" : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>

        <div style={{ textAlign: "center", margin: "16px 0", color: "var(--ink-soft)", fontSize: 12.5 }}>или</div>

        <button className="btn ghost block" onClick={handleGoogle}>Продолжить с Google</button>

        <button
          className="btn ghost block"
          style={{ marginTop: 16, border: "none" }}
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
        </button>
      </div>
    </div>
  );
}
