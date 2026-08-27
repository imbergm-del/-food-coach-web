import { createClient } from "@/lib/supabaseServer";
import { BackButton } from "@/components/BackButton";
import { ReminderToggle } from "../reminders/ReminderToggle";
import { MealRemindersToggle } from "../reminders/MealRemindersToggle";
import { savePhoneNumber, saveName } from "../reminders/actions";
import { getMealSchedule } from "@/lib/mealTypes";
import { MealScheduleForm } from "./MealScheduleForm";
import { SavedField } from "./SavedField";

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

  return (
    <div>
      <BackButton href="/profile" style={{ marginBottom: 16, display: "inline-block" }} />
      <div className="eyebrow" style={{ marginBottom: 6 }}>Настройки</div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Общие настройки</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>Как к вам обращаться</h3>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 14px" }}>
          Приложение поздоровается по имени на экране «Сегодня».
        </p>
        <SavedField action={saveName} fieldName="name" initialValue={profile?.name ?? ""} placeholder="Например, Майк" />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>Расписание приёмов пищи</h3>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 14px" }}>
          На этом времени завязано, какой приём показывается на «Сегодня», и когда приходит SMS за 30 минут до еды.
        </p>
        <MealScheduleForm schedule={schedule} />
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
          <h3 style={{ fontSize: 15 }}>SMS за 30 минут до еды</h3>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 0" }}>Короткое напоминание перед завтраком, обедом, перекусом и ужином</p>
        </div>
        <MealRemindersToggle initialEnabled={settings?.meal_reminders_enabled ?? false} />
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>Присылать SMS вместо письма</h3>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 14px" }}>
          Укажите номер — оба напоминания выше придут текстовым сообщением на телефон, а не на почту.
        </p>
        <SavedField action={savePhoneNumber} fieldName="phone" initialValue={profile?.phone ?? ""} placeholder="+1 555 123 4567" type="tel" />
      </div>
    </div>
  );
}
