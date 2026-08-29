"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { LanguageToggle } from "@/components/LanguageToggle";
import { setLanguage } from "@/app/actions/language";
import { login as dict, t, type Lang } from "@/lib/i18n";

function friendlyAuthError(lang: Lang, message: string) {
  if (message === "Email not confirmed") return t(dict, lang, "errEmailNotConfirmed");
  if (message === "Invalid login credentials") return t(dict, lang, "errInvalidCreds");
  if (message === "User already registered") return t(dict, lang, "errAlreadyRegistered");
  if (message === "auth timeout") return t(dict, lang, "errSlow");
  return message;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("auth timeout")), ms))
  ]);
}

export function LoginForm({ lang }: { lang: Lang }) {
  const tr = (key: string) => t(dict, lang, key);
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
      setError(tr("fillBoth"));
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
        setError(friendlyAuthError(lang, error.message));
        return;
      }

      const { data: { user } } = await withTimeout(supabase.auth.getUser(), 30000);
      const { data: profile, error: profileError } = user
        ? await supabase.from("profiles").select("age, language").eq("id", user.id).single()
        : { data: null, error: null };

      // Вход с нового устройства — подхватываем язык, сохранённый на аккаунте, если он
      // отличается от того, что выбран сейчас в браузере (кука по умолчанию — ru).
      if (profile?.language && profile.language !== lang) {
        await setLanguage(profile.language as Lang);
      }

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
      setError(friendlyAuthError(lang, e instanceof Error ? e.message : String(e)));
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--protein-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--protein)" strokeWidth={1.6}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3" /></svg>
          </div>
          <LanguageToggle current={lang} />
        </div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{tr("brand")}</div>
        <h1 style={{ fontSize: 26, marginBottom: 24 }}>
          {mode === "login" ? tr("welcomeBack") : tr("createAccount")}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>{tr("email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>{tr("password")}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p style={{ color: "var(--warn)", fontSize: 13.5, fontWeight: 700, marginTop: -8, marginBottom: 14 }}>{error}</p>}
          <button className="btn block" type="submit" disabled={loading}>
            {loading ? tr("working") : mode === "login" ? tr("signIn") : tr("signUp")}
          </button>
        </form>

        <div style={{ textAlign: "center", margin: "16px 0", color: "var(--ink-soft)", fontSize: 12.5 }}>{tr("or")}</div>

        <button className="btn ghost block" onClick={handleGoogle}>{tr("continueWithGoogle")}</button>

        <button
          className="btn ghost block"
          style={{ marginTop: 16, border: "none" }}
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? tr("noAccount") : tr("haveAccount")}
        </button>
      </div>
    </div>
  );
}
