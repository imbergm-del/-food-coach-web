import { createClient } from "@/lib/supabaseServer";
import { ReminderToggle } from "./ReminderToggle";
import { PlanTomorrowForm } from "./PlanTomorrowForm";
import { savePhoneNumber } from "./actions";
import { MEAL_TYPE_LABELS } from "@/lib/mealTypes";

export default async function RemindersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("reminder_settings").select("*").eq("user_id", user!.id).single();
  const { data: profile } = await supabase
    .from("profiles").select("phone").eq("id", user!.id).single();

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
            На завтра пока ничего не запланировано.
          </p>
        ) : (
          plannedMeals.map(m => (
            <div key={m.id} className="listrow">
              <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-soft)", width: 70 }}>
                {MEAL_TYPE_LABELS[m.meal_type as keyof typeof MEAL_TYPE_LABELS] ?? m.meal_type}
              </span>
              <span style={{ flex: 1, textAlign: "right" }}>{m.title}</span>
            </div>
          ))
        )}
      </div>

      <PlanTomorrowForm initiallyOpen={!plannedMeals || plannedMeals.length === 0} />

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15 }}>Присылать напоминание</h3>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 0" }}>Накануне вечером, в {sendAt}</p>
        </div>
        <ReminderToggle initialEnabled={settings?.enabled ?? true} />
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>Присылать SMS вместо письма</h3>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 14px" }}>
          Укажите номер — и напоминание придёт текстовым сообщением на телефон, а не на почту.
        </p>
        <form action={savePhoneNumber} style={{ display: "flex", gap: 8 }}>
          <input
            name="phone" type="tel" defaultValue={profile?.phone ?? ""} placeholder="+1 555 123 4567"
            style={{
              flex: 1, border: "1px solid var(--line-strong)", borderRadius: 12, padding: "11px 14px",
              fontFamily: "var(--mono)", fontSize: 14, background: "var(--card)", color: "var(--ink)"
            }}
          />
          <button className="btn" type="submit">Сохранить</button>
        </form>
      </div>
    </div>
  );
}
