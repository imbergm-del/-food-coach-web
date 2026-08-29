import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { isAdminEmail } from "@/lib/isAdmin";
import { LoadingLink } from "@/components/LoadingLink";
import { MEAL_TYPE_LABELS } from "@/lib/mealTypes";
import { cookingModeLabel } from "@/lib/cookingMode";
import { formatRelative } from "@/lib/relativeDate";

const STATUS_LABELS: Record<string, string> = {
  eaten: "Съедено", photo_logged: "По фото", planned: "Запланировано", skipped: "Пропущено", changed: "Заменено"
};

const SOURCE_LABELS: Record<string, string> = {
  home: "Вручную", photo: "По фото", change: "Замена блюда", week_plan: "По плану"
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
  const { data: reminderLog } = await admin
    .from("meal_reminder_log").select("*").eq("user_id", params.id).order("sent_at", { ascending: false }).limit(10);

  const { data: authUser } = await admin.auth.admin.getUserById(params.id);
  const email = profile.email ?? authUser?.user?.email ?? null;
  const lastLogin = authUser?.user?.last_sign_in_at ?? null;

  const loggedMeals = (meals ?? []).filter(m => m.status === "eaten" || m.status === "photo_logged");
  const totalLogged = loggedMeals.length;
  const last7 = loggedMeals.filter(m => {
    const days = (Date.now() - new Date(m.date).getTime()) / 86400000;
    return days <= 7;
  });
  const avgCalsLast7 = last7.length
    ? Math.round(last7.reduce((s, m) => s + (m.calories ?? 0), 0) / last7.length)
    : null;

  const sourceCounts = new Map<string, number>();
  loggedMeals.forEach(m => sourceCounts.set(m.source ?? "—", (sourceCounts.get(m.source ?? "—") ?? 0) + 1));

  const eveningOn = !!reminderSettings?.enabled;
  const smsOn = !!reminderSettings?.meal_reminders_enabled;
  const smsMissingPhone = smsOn && !profile.phone;

  return (
    <div className="shell">
      <div className="screen">
        <LoadingLink href="/admin" className="btn ghost" style={{ marginBottom: 16, display: "inline-block" }}>&larr; К клиентам</LoadingLink>

        <div className="eyebrow" style={{ marginBottom: 6 }}>Клиент</div>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>{profile.name ?? email ?? "Без имени"}</h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 16px" }}>{email ?? "Без email"}</p>

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
          <div className="listrow"><span>Пол</span><span>{profile.sex === "female" ? "Женский" : profile.sex === "male" ? "Мужской" : "—"}</span></div>
          <div className="listrow"><span>Рост / вес</span><span>{profile.height_cm ?? "—"} см / {profile.weight_kg ?? "—"} кг</span></div>
          <div className="listrow"><span>Тренировок в неделю</span><span>{profile.workouts_per_week ?? "—"}</span></div>
          <div className="listrow"><span>Режим готовки</span><span>{cookingModeLabel(profile.cooking_mode)}</span></div>
          <div className="listrow"><span>Норма</span><span style={{ fontFamily: "var(--mono)", fontSize: 12.5 }}>{profile.cal_target} ккал · Б{profile.protein_target} Ж{profile.fat_target} У{profile.carb_target}</span></div>
          <div className="listrow"><span>Телефон</span><span>{profile.phone ?? "—"}</span></div>
          <div className="listrow"><span>Часовой пояс</span><span>{profile.timezone ?? "—"}</span></div>
          <div className="listrow"><span>Регистрация</span><span>{profile.created_at ? new Date(profile.created_at).toLocaleString("ru-RU") : "—"}</span></div>
          <div className="listrow"><span>Последний вход</span><span>{lastLogin ? formatRelative(lastLogin) : "—"}</span></div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Уведомления</div>
          <div className="listrow">
            <span>Вечернее «на завтра»</span>
            <span style={{ color: eveningOn ? "var(--carbs)" : "var(--ink-soft)", fontWeight: 600 }}>
              {eveningOn ? `вкл · ${reminderSettings?.send_at ?? "20:00"}` : "выкл"}
            </span>
          </div>
          <div className="listrow">
            <span>SMS за 30 минут до приёма</span>
            <span style={{ color: smsOn ? "var(--carbs)" : "var(--ink-soft)", fontWeight: 600 }}>
              {smsOn ? "вкл" : "выкл"}
            </span>
          </div>
          {smsMissingPhone && (
            <p style={{ fontSize: 12, color: "var(--warn)", margin: "8px 0 0" }}>
              ⚠️ SMS включены, но телефон не указан — напоминания не отправляются.
            </p>
          )}
          {(eveningOn || smsOn) && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "0 0 6px" }}>Последние отправленные напоминания</p>
              {reminderLog?.length ? (
                reminderLog.map(l => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--ink-soft)", padding: "3px 0" }}>
                    <span>{MEAL_TYPE_LABELS[l.meal_type as keyof typeof MEAL_TYPE_LABELS] ?? l.meal_type} · {l.date}</span>
                    <span style={{ fontFamily: "var(--mono)" }}>{formatRelative(l.sent_at)}</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0 }}>Пока ничего не отправлялось.</p>
              )}
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Как пользуется</div>
          {sourceCounts.size ? (
            [...sourceCounts.entries()].map(([source, count]) => (
              <div key={source} className="listrow">
                <span>{SOURCE_LABELS[source] ?? source}</span>
                <span style={{ fontFamily: "var(--mono)" }}>{count}</span>
              </div>
            ))
          ) : (
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>Активности пока нет.</p>
          )}
        </div>

        <div className="eyebrow" style={{ marginBottom: 8 }}>Питание — последние записи</div>
        <div className="card">
          {meals?.length ? (
            meals.map(m => (
              <div key={m.id} className="listrow" style={{ flexDirection: "column", alignItems: "stretch", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>
                    {MEAL_TYPE_LABELS[m.meal_type as keyof typeof MEAL_TYPE_LABELS] ?? m.meal_type} — {m.title ?? "без названия"}
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>{m.date}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-soft)" }}>
                    {m.calories ?? 0} ккал · Б{m.protein ?? 0} Ж{m.fat ?? 0} У{m.carbs ?? 0}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                    {STATUS_LABELS[m.status] ?? m.status} · {SOURCE_LABELS[m.source ?? ""] ?? m.source ?? "—"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>Записей о еде пока нет.</p>
          )}
        </div>
      </div>
    </div>
  );
}
