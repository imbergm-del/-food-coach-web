"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

function friendlyAuthError(message: string) {
  if (message === "Email not confirmed") return "Please confirm your email before next step.";
  if (message === "Invalid login credentials") return "Неверный email или пароль.";
  if (message === "User already registered") return "Этот email уже зарегистрирован — попробуйте войти.";
  return message;
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

    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) {
      setError(friendlyAuthError(error.message));
      return;
    }
    router.push("/onboarding");
    router.refresh();
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
