import { createClient } from "@/lib/supabaseServer";
import { signOut } from "./actions";
import { isAdminEmail } from "@/lib/isAdmin";
import { SubmitButton } from "@/components/SubmitButton";
import { LoadingLink } from "@/components/LoadingLink";
import { getLang } from "@/lib/language";
import { profile as dict, t } from "@/lib/i18n";

export default async function ProfilePage() {
  const lang = getLang();
  const tr = (key: string) => t(dict, lang, key);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{tr("eyebrow")}</div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>{user?.email}</h1>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="listrow"><span>{tr("age")}</span><span>{profile?.age ?? "—"}</span></div>
        <div className="listrow"><span>{tr("height")}</span><span>{profile?.height_cm ?? "—"} {tr("cm")}</span></div>
        <div className="listrow"><span>{tr("weight")}</span><span>{profile?.weight_kg ?? "—"} {tr("kg")}</span></div>
        <div className="listrow"><span>{tr("workouts")}</span><span>{profile?.workouts_per_week ?? "—"}</span></div>
      </div>
      <LoadingLink href="/reports" className="btn ghost block" style={{ marginBottom: 14, textAlign: "center" }}>{tr("reports")}</LoadingLink>
      <LoadingLink href="/settings" className="btn ghost block" style={{ marginBottom: 14, textAlign: "center" }}>{tr("settings")}</LoadingLink>
      {isAdminEmail(user?.email) && (
        <LoadingLink href="/admin" className="btn ghost block" style={{ marginBottom: 14, textAlign: "center" }}>{tr("admin")}</LoadingLink>
      )}
      <form action={signOut}>
        <SubmitButton className="btn ghost block" pendingText={tr("signingOut")}>{tr("signOut")}</SubmitButton>
      </form>
    </div>
  );
}
