import { createClient } from "@/lib/supabaseServer";
import { BackButton } from "@/components/BackButton";
import { todayISOInTz, addDaysISO, nowInTz } from "@/lib/userTime";
import { MEAL_SEQUENCE, MEAL_TYPE_LABELS, getMealSchedule, type MealType } from "@/lib/mealTypes";

const WEEKDAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const DAYS = 7;
const CUTOVER_GRACE_MINUTES = 30;

type DayStat = {
  iso: string; label: string; isToday: boolean; calories: number; protein: number; fat: number; carbs: number;
  logged: boolean; missed: MealType[];
};

export default async function ReportsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const tz = profile?.timezone;

  const today = todayISOInTz(tz);
  const startISO = addDaysISO(today, -(DAYS - 1));

  const { data: meals } = await supabase
    .from("meals")
    .select("date, meal_type, calories, protein, fat, carbs")
    .eq("user_id", user!.id)
    .gte("date", startISO)
    .lte("date", today)
    .in("status", ["eaten", "photo_logged"]);

  const byDate = new Map<string, { calories: number; protein: number; fat: number; carbs: number; types: Set<string> }>();
  for (const m of meals ?? []) {
    const cur = byDate.get(m.date) ?? { calories: 0, protein: 0, fat: 0, carbs: 0, types: new Set<string>() };
    cur.calories += m.calories ?? 0;
    cur.protein += m.protein ?? 0;
    cur.fat += m.fat ?? 0;
    cur.carbs += m.carbs ?? 0;
    cur.types.add(m.meal_type);
    byDate.set(m.date, cur);
  }

  // Пропущенным считается только приём, чьё окно (время + 30 минут) уже закрылось —
  // сегодняшний ужин, который ещё впереди, не в счёт; для прошлых дней закрыты все.
  const schedule = getMealSchedule(profile);
  const nowMinutes = nowInTz(tz).getHours() * 60 + nowInTz(tz).getMinutes();
  const toMinutes = (h: number, m: number) => h * 60 + m;

  const days: DayStat[] = Array.from({ length: DAYS }, (_, i) => {
    const iso = addDaysISO(startISO, i);
    const weekday = new Date(`${iso}T00:00:00`).getDay();
    const isToday = iso === today;
    const totals = byDate.get(iso);
    const loggedTypes = totals?.types ?? new Set<string>();
    const elapsedTypes = MEAL_SEQUENCE.filter(t =>
      !isToday || nowMinutes >= toMinutes(schedule[t].hour, schedule[t].minute) + CUTOVER_GRACE_MINUTES
    );
    const missed = iso <= today ? elapsedTypes.filter(t => !loggedTypes.has(t)) : [];
    return {
      iso, label: WEEKDAY_LABELS[weekday], isToday,
      calories: totals?.calories ?? 0, protein: totals?.protein ?? 0, fat: totals?.fat ?? 0, carbs: totals?.carbs ?? 0,
      logged: !!totals, missed
    };
  });

  const loggedDays = days.filter(d => d.logged);
  const avg = (key: "calories" | "protein" | "fat" | "carbs") =>
    days.length ? Math.round(days.reduce((s, d) => s + d[key], 0) / days.length) : 0;

  const calTarget = profile?.cal_target ?? 2000;
  const maxBar = Math.max(calTarget, ...days.map(d => d.calories), 1);
  const targetLinePct = Math.min(100, (calTarget / maxBar) * 100);

  return (
    <div>
      <BackButton className="btn ghost" style={{ marginBottom: 16, display: "inline-block" }} />
      <div className="eyebrow" style={{ marginBottom: 6 }}>Последние {DAYS} дней</div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Статистика</h1>

      <div className="goalgrid" style={{ marginBottom: 20 }}>
        <div className="goalcell cal"><b>{avg("calories")}</b><span>ккал/день</span></div>
        <div className="goalcell protein"><b>{avg("protein")}</b><span>белок/день</span></div>
        <div className="goalcell fat"><b>{avg("fat")}</b><span>жиры/день</span></div>
        <div className="goalcell carbs"><b>{loggedDays.length}</b><span>из {DAYS} дней</span></div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Калории по дням · цель {calTarget}</div>
        <div style={{ position: "relative", height: 140, display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 8 }}>
          <div
            style={{
              position: "absolute", left: 0, right: 0, bottom: `${targetLinePct}%`,
              borderTop: "1px dashed var(--ink-soft)", opacity: 0.5
            }}
          />
          {days.map(d => {
            const h = Math.max(2, Math.round((d.calories / maxBar) * 140));
            const over = d.calories > calTarget * 1.02;
            return (
              <div key={d.iso} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                <div
                  style={{
                    width: "100%", maxWidth: 28, height: h, borderRadius: "6px 6px 2px 2px",
                    background: over ? "var(--warn)" : "var(--protein)", opacity: d.logged ? 1 : 0.25
                  }}
                />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {days.map(d => (
            <div key={d.iso} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, fontWeight: d.isToday ? 700 : 500, color: d.isToday ? "var(--ink)" : "var(--ink-soft)" }}>
                {d.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>По дням</div>
      <div className="card">
        {days.slice().reverse().map((d, i) => (
          <div key={d.iso} className="listrow" style={{ flexDirection: "column", alignItems: "stretch", gap: 4, borderTop: i === 0 ? "none" : undefined, padding: "10px 0" }}>
            <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13.5 }}>
                {d.label}{d.isToday ? " · сегодня" : ""}
                {!d.logged && <span style={{ color: "var(--ink-soft)" }}> — нет записей</span>}
              </span>
              {d.logged && (
                <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-soft)" }}>{d.calories} ккал</span>
                  <span className="macrolabel" style={{ margin: 0, color: "var(--protein)" }}>Б{d.protein}</span>
                  <span className="macrolabel" style={{ margin: 0, color: "var(--fat-ink)" }}>Ж{d.fat}</span>
                  <span className="macrolabel" style={{ margin: 0, color: "var(--carbs)" }}>У{d.carbs}</span>
                </span>
              )}
            </span>
            {d.missed.length > 0 && (
              <span style={{ fontSize: 11.5, color: "var(--warn)" }}>
                Пропущено: {d.missed.map(t => MEAL_TYPE_LABELS[t]).join(", ")}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
