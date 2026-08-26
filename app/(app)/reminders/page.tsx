import { createClient } from "@/lib/supabaseServer";
import { ReminderToggle } from "./ReminderToggle";

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Завтрак", lunch: "Обед", snack: "Перекус", dinner: "Ужин"
};

export default async function RemindersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("reminder_settings").select("*").eq("user_id", user!.id).single();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().slice(0, 10);

  const { data: plannedMeals } = await supabase
    .from("meals").select("*").eq("user_id", user!.id).eq("date", tomorrowISO).order("id");

  const sendAt = settings?.send_at?.slice(0, 5) ?? "20:00";

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Придёт сегодня в {sendAt}</div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Ваше питание на завтра</h1>
      <div className="card" style={{ marginBottom: 16 }}>
        {!plannedMeals || plannedMeals.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
            На завтра пока ничего не запланировано — план соберётся по мере того, как вы записываете приёмы пищи.
          </p>
        ) : (
          plannedMeals.map(m => (
            <div key={m.id} className="listrow">
              <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-soft)", width: 70 }}>
                {MEAL_TYPE_LABELS[m.meal_type] ?? m.meal_type}
              </span>
              <span style={{ flex: 1, textAlign: "right" }}>{m.title}</span>
            </div>
          ))
        )}
      </div>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: 15 }}>Присылать напоминание</h3>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 0" }}>Накануне вечером, в {sendAt}</p>
        </div>
        <ReminderToggle initialEnabled={settings?.enabled ?? true} />
      </div>
    </div>
  );
}
