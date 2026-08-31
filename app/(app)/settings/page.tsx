import { createClient } from "@/lib/supabaseServer";
import { BackButton } from "@/components/BackButton";
import { ReminderToggle } from "../reminders/ReminderToggle";
import { MealRemindersToggle } from "../reminders/MealRemindersToggle";
import { savePhoneNumber, saveName } from "../reminders/actions";
import { getMealSchedule } from "@/lib/mealTypes";
import { MealScheduleForm } from "./MealScheduleForm";
import { SavedField } from "./SavedField";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getLang } from "@/lib/language";
import { settings as dict, t } from "@/lib/i18n";

export default async function SettingsPage() {
  const lang = getLang();
  const tr = (key: string) => t(dict, lang, key);
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
      <BackButton href="/profile" className="btn ghost" style={{ marginBottom: 16, display: "inline-block" }} />
      <div className="eyebrow" style={{ marginBottom: 6 }}>{tr("eyebrow")}</div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>{tr("title")}</h1>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15 }}>{tr("language")}</h3>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 0" }}>{tr("languageDesc")}</p>
        </div>
        <LanguageToggle current={lang} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>{tr("nameTitle")}</h3>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 14px" }}>
          {tr("nameDesc")}
        </p>
        <SavedField action={saveName} fieldName="name" initialValue={profile?.name ?? ""} placeholder={tr("namePlaceholder")} lang={lang} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>{tr("scheduleTitle")}</h3>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 14px" }}>
          {tr("scheduleDesc")}
        </p>
        <MealScheduleForm schedule={schedule} lang={lang} />
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15 }}>{tr("reminderTitle")}</h3>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 0" }}>{tr("reminderDesc")} {sendAt}</p>
        </div>
        <ReminderToggle initialEnabled={settings?.enabled ?? true} />
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15 }}>{tr("smsTitle")}</h3>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 0" }}>{tr("smsDesc")}</p>
        </div>
        <MealRemindersToggle initialEnabled={settings?.meal_reminders_enabled ?? false} />
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>{tr("smsInsteadTitle")}</h3>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 14px" }}>
          {tr("smsInsteadDesc")}
        </p>
        <SavedField action={savePhoneNumber} fieldName="phone" initialValue={profile?.phone ?? ""} placeholder="+1 555 123 4567" type="tel" lang={lang} />
      </div>
    </div>
  );
}
