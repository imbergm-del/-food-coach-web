import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import { LoadingLink } from "@/components/LoadingLink";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { isAdminEmail } from "@/lib/isAdmin";
import { cookingModeLabel } from "@/lib/cookingMode";
import { formatRelative } from "@/lib/relativeDate";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) redirect("/today");

  const admin = createAdminClient();

  const { data: profiles } = await admin.from("profiles").select("*").order("created_at", { ascending: false });
  const { data: meals } = await admin.from("meals").select("user_id, status, created_at").in("status", ["eaten", "photo_logged"]);

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

        <div className="eyebrow" style={{ marginBottom: 10 }}>Все клиенты ({totalClients})</div>

        {!profiles?.length && (
          <div className="card"><p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>Клиентов пока нет.</p></div>
        )}

        {profiles?.map(p => {
          const stats = mealStatsByUser.get(p.id);
          const onboarded = p.age != null;
          return (
            <LoadingLink
              key={p.id}
              href={`/admin/clients/${p.id}`}
              className="card"
              style={{
                display: "block", width: "100%", textAlign: "left", marginBottom: 10,
                textDecoration: "none", border: "none", cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.email ?? "Без email"}
                  </div>
                  {p.name && <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>{p.name}</div>}
                </div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>
                  рег. {p.created_at ? new Date(p.created_at).toLocaleDateString("ru-RU") : "—"}
                </span>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                <span style={{
                  fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
                  background: onboarded ? "var(--carbs-bg)" : "var(--protein-bg)", color: onboarded ? "var(--carbs)" : "var(--protein)"
                }}>
                  {onboarded ? "Онбординг ✓" : "Онбординг не завершён"}
                </span>
                <span style={{
                  fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
                  background: "var(--paper2)", color: "var(--ink-soft)"
                }}>
                  {cookingModeLabel(p.cooking_mode)}
                </span>
              </div>

              <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                {stats
                  ? `Записал(а) ${stats.count} приёмов пищи · последний раз ${formatRelative(stats.lastAt)}`
                  : "Ещё не записывал(а) ни одного приёма пищи"}
              </p>
            </LoadingLink>
          );
        })}
      </div>
    </div>
  );
}
