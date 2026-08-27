import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import { LoadingLink } from "@/components/LoadingLink";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { isAdminEmail } from "@/lib/isAdmin";
import { cookingModeLabel } from "@/lib/cookingMode";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) redirect("/today");

  const admin = createAdminClient();

  const { data: profiles } = await admin.from("profiles").select("*").order("created_at", { ascending: false });
  const { data: reminderSettings } = await admin.from("reminder_settings").select("user_id, enabled");
  const { data: meals } = await admin.from("meals").select("user_id, status, created_at").in("status", ["eaten", "photo_logged"]);

  const remindersByUser = new Map((reminderSettings ?? []).map(r => [r.user_id, r.enabled]));
  const mealStatsByUser = new Map<string, { count: number; lastAt: string }>();
  (meals ?? []).forEach(m => {
    const cur = mealStatsByUser.get(m.user_id) ?? { count: 0, lastAt: "" };
    cur.count += 1;
    if (!cur.lastAt || m.created_at > cur.lastAt) cur.lastAt = m.created_at;
    mealStatsByUser.set(m.user_id, cur);
  });

  const totalClients = profiles?.length ?? 0;
  const onboardedCount = profiles?.filter(p => p.age != null).length ?? 0;
  const activeToday = [...mealStatsByUser.values()].filter(s => s.lastAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;

  return (
    <div className="shell">
      <div className="screen">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Админ</div>
            <h1 style={{ fontSize: 26 }}>Клиенты</h1>
          </div>
          <LoadingLink href="/today" className="btn ghost">В приложение</LoadingLink>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div className="card" style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 700 }}>{totalClients}</div>
            <div className="eyebrow" style={{ marginTop: 4, fontSize: 9.5 }}>Всего клиентов</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 700 }}>{onboardedCount}</div>
            <div className="eyebrow" style={{ marginTop: 4, fontSize: 9.5 }}>Прошли онбординг</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 700 }}>{activeToday}</div>
            <div className="eyebrow" style={{ marginTop: 4, fontSize: 9.5 }}>Активны сегодня</div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 720 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line-strong)" }}>
                <th style={{ padding: "8px 10px", fontSize: 11 }}>Email</th>
                <th style={{ padding: "8px 10px", fontSize: 11 }}>Имя</th>
                <th style={{ padding: "8px 10px", fontSize: 11 }}>Регистрация</th>
                <th style={{ padding: "8px 10px", fontSize: 11 }}>Онбординг</th>
                <th style={{ padding: "8px 10px", fontSize: 11 }}>Готовка</th>
                <th style={{ padding: "8px 10px", fontSize: 11 }}>Приёмов записано</th>
                <th style={{ padding: "8px 10px", fontSize: 11 }}>Последняя активность</th>
                <th style={{ padding: "8px 10px", fontSize: 11 }}>Напоминания</th>
              </tr>
            </thead>
            <tbody>
              {profiles?.map(p => {
                const stats = mealStatsByUser.get(p.id);
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "8px 10px" }}>{p.email ?? "—"}</td>
                    <td style={{ padding: "8px 10px" }}>{p.name ?? "—"}</td>
                    <td style={{ padding: "8px 10px", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-soft)" }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString("ru-RU") : "—"}
                    </td>
                    <td style={{ padding: "8px 10px" }}>{p.age != null ? "✓" : "—"}</td>
                    <td style={{ padding: "8px 10px" }}>{cookingModeLabel(p.cooking_mode)}</td>
                    <td style={{ padding: "8px 10px", fontFamily: "var(--mono)" }}>{stats?.count ?? 0}</td>
                    <td style={{ padding: "8px 10px", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-soft)" }}>
                      {stats?.lastAt ? new Date(stats.lastAt).toLocaleString("ru-RU") : "—"}
                    </td>
                    <td style={{ padding: "8px 10px" }}>{remindersByUser.get(p.id) ? "вкл" : "выкл"}</td>
                  </tr>
                );
              })}
              {!profiles?.length && (
                <tr><td colSpan={8} style={{ padding: "16px 10px", color: "var(--ink-soft)" }}>Клиентов пока нет.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
