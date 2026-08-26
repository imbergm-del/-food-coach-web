import { createClient } from "@/lib/supabaseServer";
import { signOut } from "./actions";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Профиль</div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>{user?.email}</h1>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="listrow"><span>Возраст</span><span>{profile?.age ?? "—"}</span></div>
        <div className="listrow"><span>Рост</span><span>{profile?.height_cm ?? "—"} см</span></div>
        <div className="listrow"><span>Вес</span><span>{profile?.weight_kg ?? "—"} кг</span></div>
        <div className="listrow"><span>Тренировок в неделю</span><span>{profile?.workouts_per_week ?? "—"}</span></div>
      </div>
      <form action={signOut}>
        <button className="btn ghost block" type="submit">Выйти</button>
      </form>
    </div>
  );
}
