import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { isAdminEmail } from "@/lib/isAdmin";
import { LoadingLink } from "@/components/LoadingLink";
import { MEAL_TYPE_LABELS } from "@/lib/mealTypes";
import { cookingModeLabel } from "@/lib/cookingMode";

const STATUS_LABELS: Record<string, string> = {
  eaten: "Съедено", photo_logged: "По фото", planned: "Запланировано", skipped: "Пропущено", changed: "Заменено"
};

export default async function AdminClientPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) redirect("/today");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", params.id).single();
  if (!profile) redirect("/admin");

  const { data: meals } = await admin
    .from("meals").select("*").eq("user_id", params.id).order("date", { ascending: false }).order("id", { ascending: false }).limit(120);
  const { data: reminderSettings } = await admin
    .from("reminder_settings").select("*").eq("user_id", params.id).single();

  const loggedMeals = (meals ?? []).filter(m => m.status === "eaten" || m.status === "photo_logged");
  const totalLogged = loggedMeals.length;
  const last7 = loggedMeals.filter(m => {
    const days = (Date.now() - new Date(m.date).getTime()) / 86400000;
    return days <= 7;
  });
  const avgCalsLast7 = last7.length
    ? Math.round(last7.reduce((s, m) => s + (m.calories ?? 0), 0) / last7.length)
    : null;

  return (
    <div className="shell">
      <div className="screen">
        <LoadingLink href="/admin" className="btn ghost" style={{ marginBottom: 16, display: "inline-block" }}>&larr; К клиентам</LoadingLink>

        <div className="eyebrow" style={{ marginBottom: 6 }}>Клиент</div>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>{profile.name ?? profile.email ?? "Без имени"}</h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 16px" }}>{profile.email}</p>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div className="card" style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700 }}>{totalLogged}</div>
            <div className="eyebrow" style={{ marginTop: 4, fontSize: 9.5 }}>Приёмов всего</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700 }}>{last7.length}</div>
            <div className="eyebrow" style={{ marginTop: 4, fontSize: 9.5 }}>За 7 дней</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700 }}>{avgCalsLast7 ?? "—"}</div>
            <div className="eyebrow" style={{ marginTop: 4, fontSize: 9.5 }}>Ккал/приём, 7д</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Профиль</div>
          <div className="listrow"><span>Возраст</span><span>{profile.age ?? "—"}</span></div>
          <div className="listrow"><span>Рост / вес</span><span>{profile.height_cm ?? "—"} см / {profile.weight_kg ?? "—"} кг</span></div>
          <div className="listrow"><span>Тренировок в неделю</span><span>{profile.workouts_per_week ?? "—"}</span></div>
          <div className="listrow"><span>Режим готовки</span><span>{cookingModeLabel(profile.cooking_mode)}</span></div>
          <div className="listrow"><span>Норма</span><span style={{ fontFamily: "var(--mono)", fontSize: 12.5 }}>{profile.cal_target} ккал · Б{profile.protein_target} Ж{profile.fat_target} У{profile.carb_target}</span></div>
          <div className="listrow"><span>Телефон</span><span>{profile.phone ?? "—"}</span></div>
          <div className="listrow"><span>Часовой пояс</span><span>{profile.timezone ?? "—"}</span></div>
          <div className="listrow">
            <span>Напоминания</span>
            <span>
              {reminderSettings?.enabled ? "вечернее · " : ""}
              {reminderSettings?.meal_reminders_enabled ? "SMS за час" : (!reminderSettings?.enabled ? "выкл" : "")}
            </span>
          </div>
          <div className="listrow"><span>Регистрация</span><span>{profile.created_at ? new Date(profile.created_at).toLocaleString("ru-RU") : "—"}</span></div>
        </div>

        <div className="eyebrow" style={{ marginBottom: 8 }}>Питание — последние записи</div>
        <div className="card">
          {meals?.length ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 560 }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line-strong)" }}>
                    <th style={{ padding: "6px 8px", fontSize: 10.5 }}>Дата</th>
                    <th style={{ padding: "6px 8px", fontSize: 10.5 }}>Приём</th>
                    <th style={{ padding: "6px 8px", fontSize: 10.5 }}>Блюдо</th>
                    <th style={{ padding: "6px 8px", fontSize: 10.5 }}>КБЖУ</th>
                    <th style={{ padding: "6px 8px", fontSize: 10.5 }}>Статус</th>
                    <th style={{ padding: "6px 8px", fontSize: 10.5 }}>Источник</th>
                  </tr>
                </thead>
                <tbody>
                  {meals.map(m => (
                    <tr key={m.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "6px 8px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>{m.date}</td>
                      <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>{MEAL_TYPE_LABELS[m.meal_type as keyof typeof MEAL_TYPE_LABELS] ?? m.meal_type}</td>
                      <td style={{ padding: "6px 8px" }}>{m.title ?? "—"}</td>
                      <td style={{ padding: "6px 8px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>
                        {m.calories ?? 0} / Б{m.protein ?? 0} Ж{m.fat ?? 0} У{m.carbs ?? 0}
                      </td>
                      <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>{STATUS_LABELS[m.status] ?? m.status}</td>
                      <td style={{ padding: "6px 8px", color: "var(--ink-soft)", whiteSpace: "nowrap" }}>{m.source ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>Записей о еде пока нет.</p>
          )}
        </div>
      </div>
    </div>
  );
}
