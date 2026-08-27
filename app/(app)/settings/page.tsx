import { createClient } from "@/lib/supabaseServer";
import { BackButton } from "@/components/BackButton";
import { SubmitButton } from "@/components/SubmitButton";
import { ReminderToggle } from "../reminders/ReminderToggle";
import { MealRemindersToggle } from "../reminders/MealRemindersToggle";
import { savePhoneNumber, saveName, saveMealSchedule } from "../reminders/actions";
import { MEAL_TYPE_LABELS, MEAL_SEQUENCE, getMealSchedule } from "@/lib/mealTypes";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("reminder_settings").select("*").eq("user_id", user!.id).single();
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phone, breakfast_time, lunch_time, snack_time, dinner_time")
    .eq("id", user!.id).single();

  const sendAt = settings?.send_at?.slice(0, 5) ?? "20:00";
  const schedule = getMealSchedule(profile);
  const timeValue = (t: { hour: number; minute: number }) =>
    `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;

  return (
    <div>
      <BackButton style={{ marginBottom: 16, display: "inline-block" }} />
      <div className="eyebrow" style={{ marginBottom: 6 }}>Настройки</div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Общие настройки</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>Как к вам обращаться</h3>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 14px" }}>
          Приложение поздоровается по имени на экране «Сегодня».
        </p>
        <form action={saveName} style={{ display: "flex", gap: 8 }}>
          <input
            name="name" type="text" defaultValue={profile?.name ?? ""} placeholder="Например, Майк"
            style={{
              flex: 1, border: "1px solid var(--line-strong)", borderRadius: 12, padding: "11px 14px",
              fontFamily: "var(--sans)", fontSize: 14, background: "var(--card)", color: "var(--ink)"
            }}
          />
          <SubmitButton className="btn" style={{ width: "auto" }} pendingText="Сохраняем…">Сохранить</SubmitButton>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>Расписание приёмов пищи</h3>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 14px" }}>
          На этом времени завязано, какой приём показывается на «Сегодня», и когда приходит SMS за час до еды.
        </p>
        <form action={saveMealSchedule}>
          {MEAL_SEQUENCE.map(mealType => (
            <div key={mealType} className="listrow" style={{ padding: "8px 0" }}>
              <span style={{ fontSize: 13.5 }}>{MEAL_TYPE_LABELS[mealType]}</span>
              <input
                name={`${mealType}_time`} type="time" defaultValue={timeValue(schedule[mealType])}
                style={{
                  border: "1px solid var(--line-strong)", borderRadius: 10, padding: "8px 10px",
                  fontFamily: "var(--mono)", fontSize: 14, background: "var(--card)", color: "var(--ink)"
                }}
              />
            </div>
          ))}
          <SubmitButton className="btn" style={{ width: "auto", marginTop: 10 }} pendingText="Сохраняем…">Сохранить</SubmitButton>
        </form>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15 }}>Присылать напоминание</h3>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 0" }}>Питание на завтра, накануне вечером в {sendAt}</p>
        </div>
        <ReminderToggle initialEnabled={settings?.enabled ?? true} />
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15 }}>SMS за час до еды</h3>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 0" }}>Короткое напоминание перед завтраком, обедом, перекусом и ужином</p>
        </div>
        <MealRemindersToggle initialEnabled={settings?.meal_reminders_enabled ?? false} />
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>Присылать SMS вместо письма</h3>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 14px" }}>
          Укажите номер — оба напоминания выше придут текстовым сообщением на телефон, а не на почту.
        </p>
        <form action={savePhoneNumber} style={{ display: "flex", gap: 8 }}>
          <input
            name="phone" type="tel" defaultValue={profile?.phone ?? ""} placeholder="+1 555 123 4567"
            style={{
              flex: 1, border: "1px solid var(--line-strong)", borderRadius: 12, padding: "11px 14px",
              fontFamily: "var(--mono)", fontSize: 14, background: "var(--card)", color: "var(--ink)"
            }}
          />
          <SubmitButton className="btn" style={{ width: "auto" }} pendingText="Сохраняем…">Сохранить</SubmitButton>
        </form>
      </div>
    </div>
  );
}
