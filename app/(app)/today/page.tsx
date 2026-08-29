import { createClient } from "@/lib/supabaseServer";
import { LoadingLink } from "@/components/LoadingLink";
import { addWater } from "./actions";
import { CookingModeTabs } from "./CookingModeTabs";
import { MacroBreakdown } from "@/components/MacroBreakdown";
import { MealCard } from "./MealCard";
import { SubmitButton } from "@/components/SubmitButton";
import { mealTypeLabel, getMealSchedule } from "@/lib/mealTypes";
import { MEAL_POOL } from "@/lib/mealMenu";
import { filterPoolForMode } from "@/lib/mealRotation";
import { getDisplayMealType } from "@/lib/getDisplayMealType";
import { normalizeCookingMode } from "@/lib/cookingMode";
import { scaleMealToTarget } from "@/lib/scaleMeal";
import { nowInTz, todayISOInTz } from "@/lib/userTime";
import { saveName } from "../reminders/actions";
import { getLang } from "@/lib/language";
import { today as dict, t, type Lang } from "@/lib/i18n";

function timeGreeting(lang: Lang, tz?: string | null) {
  const hour = nowInTz(tz).getHours();
  if (hour < 5) return t(dict, lang, "greetingNight");
  if (hour < 12) return t(dict, lang, "greetingMorning");
  if (hour < 18) return t(dict, lang, "greetingDay");
  return t(dict, lang, "greetingEvening");
}

function dateLabel(lang: Lang, tz?: string | null) {
  return nowInTz(tz).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU", { weekday: "short", day: "numeric", month: "long" }).toUpperCase();
}

function formatDateLabel(lang: Lang, iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU", { weekday: "short", day: "numeric", month: "long" });
}

export default async function TodayPage() {
  const lang = getLang();
  const tr = (key: string) => t(dict, lang, key);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const tz = profile?.timezone;

  const today = todayISOInTz(tz);
  const { data: meals } = await supabase
    .from("meals").select("*").eq("user_id", user!.id).eq("date", today).order("id");

  const { data: waterRow } = await supabase
    .from("water_logs").select("amount_ml").eq("user_id", user!.id).eq("date", today).maybeSingle();
  const waterMl = waterRow?.amount_ml ?? 0;
  const waterTarget = Math.round((profile?.weight_kg ? profile.weight_kg * 33 : 2000) / 50) * 50;

  const cookingMode = normalizeCookingMode(profile?.cooking_mode);
  const mealSchedule = getMealSchedule(profile);
  const { type: displayType, date: mealDate } = await getDisplayMealType(supabase, user!.id, tz, mealSchedule);
  const isTomorrow = mealDate !== today;

  const mealDateMeals = isTomorrow
    ? (await supabase.from("meals").select("*").eq("user_id", user!.id).eq("date", mealDate).order("id")).data
    : meals;

  // Если этот приём был спланирован вечером заранее (см. «Напоминания»), покажем его вместо общей подсказки
  const plannedRow = displayType ? mealDateMeals?.find(m => m.meal_type === displayType && m.status === "planned") : undefined;
  const plannedBadge =
    plannedRow?.source === "plan" ? (lang === "en" ? "Your evening plan" : "Ваш план на вечер")
    : plannedRow?.source === "week_plan" ? (lang === "en" ? "Weekly plan" : "План на неделю")
    : plannedRow?.source === "change" ? (lang === "en" ? "Your pick" : "Ваш выбор")
    : (lang === "en" ? "From the plan" : "Из плана");

  // Один и тот же список вариантов (с учётом переключателя "Сколько времени есть на еду")
  // и для показа текущего блюда, и для кнопки "Заменить" на этой же странице — без
  // отдельного перехода на другой экран.
  const calTarget = profile?.cal_target ?? 2200;
  const options = displayType
    ? filterPoolForMode(MEAL_POOL[displayType], cookingMode, nowInTz(tz).getHours()).map(def => ({
        ...scaleMealToTarget(def, displayType, calTarget)
      }))
    : [];
  const currentTitle = plannedRow?.title;
  const startIndex = Math.max(0, options.findIndex(o => o.title === currentTitle));

  const p = profile ?? { protein_target: 125, fat_target: 72, carb_target: 210, cal_target: 2200, name: "друг" };
  const usedProtein = meals?.reduce((s, m) => s + (m.status === "eaten" || m.status === "photo_logged" ? m.protein ?? 0 : 0), 0) ?? 0;
  const usedFat = meals?.reduce((s, m) => s + (m.status === "eaten" || m.status === "photo_logged" ? m.fat ?? 0 : 0), 0) ?? 0;
  const usedCarbs = meals?.reduce((s, m) => s + (m.status === "eaten" || m.status === "photo_logged" ? m.carbs ?? 0 : 0), 0) ?? 0;
  const usedCals = usedProtein * 4 + usedFat * 9 + usedCarbs * 4;
  const caloriesLeft = Math.max(0, p.cal_target - usedCals);
  const eatenMeals = meals?.filter(m => m.status === "eaten" || m.status === "photo_logged") ?? [];

  return (
    <div>
      <div className="eyebrow" style={{ fontWeight: 800 }}>{tr("today")} · {dateLabel(lang, tz)}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "6px 0 10px" }}>
        <h1 style={{ fontSize: 30 }}>{timeGreeting(lang, tz)}, {p.name ?? (lang === "en" ? "friend" : "друг")}</h1>
        <LoadingLink href="/profile" className="btn ghost" style={{ padding: "8px 10px", borderRadius: "50%" }} ariaLabel={lang === "en" ? "Profile" : "Профиль"}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.5-2-3.4-2.3.7a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.3a7.6 7.6 0 0 0-2.6 1.5l-2.3-.7-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.7a7.6 7.6 0 0 0 2.6 1.5l.4 2.3h4l.4-2.3a7.6 7.6 0 0 0 2.6-1.5l2.3.7 2-3.4-1.9-1.5Z" /></svg>
        </LoadingLink>
      </div>
      {!profile?.name && (
        <div className="card" style={{ marginBottom: 16, borderLeft: "5px solid var(--protein)" }}>
          <p style={{ fontSize: 13.5, margin: "0 0 10px" }}>{tr("whatsYourName")}</p>
          <form action={saveName} style={{ display: "flex", gap: 8 }}>
            <input
              name="name" type="text" placeholder={tr("namePlaceholder")} autoFocus
              style={{
                flex: 1, border: "1px solid var(--line-strong)", borderRadius: 12, padding: "11px 14px",
                fontFamily: "var(--sans)", fontSize: 14, background: "var(--card)", color: "var(--ink)"
              }}
            />
            <SubmitButton className="btn" style={{ width: "auto" }} pendingText={tr("saving")}>{tr("save")}</SubmitButton>
          </form>
        </div>
      )}
      {isTomorrow && (
        <p style={{ fontSize: 12.5, color: "var(--protein)", fontWeight: 700, margin: "-8px 0 16px" }}>
          {tr("lateNotice")} {formatDateLabel(lang, mealDate)}.
        </p>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <MacroBreakdown
          lang={lang}
          meals={eatenMeals} usedCals={usedCals} usedProtein={usedProtein} usedFat={usedFat} usedCarbs={usedCarbs}
          calTarget={p.cal_target} proteinTarget={p.protein_target} fatTarget={p.fat_target} carbTarget={p.carb_target}
          caloriesLeft={caloriesLeft}
        />
      </div>

      <div className="card" style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: "var(--water-bg)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--water)" strokeWidth={1.7}>
              <path d="M12 3s7 7.5 7 12.5a7 7 0 0 1-14 0C5 10.5 12 3 12 3Z" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">{tr("water")}</div>
            <h3 style={{ fontSize: 16, marginTop: 4 }}>{waterMl} / {waterTarget} {tr("ml")}</h3>
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: "var(--paper2)", overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, Math.round((waterMl / waterTarget) * 100))}%`, height: "100%", background: "var(--water)", borderRadius: 999 }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <form action={addWater}>
            <input type="hidden" name="amount" value="250" />
            <input type="hidden" name="date" value={today} />
            <SubmitButton className="actbtn ghost" pendingText="…">{tr("plus250")}</SubmitButton>
          </form>
          <form action={addWater}>
            <input type="hidden" name="amount" value="500" />
            <input type="hidden" name="date" value={today} />
            <SubmitButton className="actbtn ghost" pendingText="…">{tr("plus500")}</SubmitButton>
          </form>
          {waterMl > 0 && (
            <form action={addWater} style={{ marginLeft: "auto" }}>
              <input type="hidden" name="amount" value={-waterMl} />
              <input type="hidden" name="date" value={today} />
              <SubmitButton className="btn ghost" pendingText="…">{tr("reset")}</SubmitButton>
            </form>
          )}
        </div>
      </div>

      {plannedRow && plannedRow.source !== "week_plan" && (
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 10px" }}>
          {tr("manualNotice")}
        </p>
      )}
      <CookingModeTabs current={cookingMode} mealType={displayType} mealDate={mealDate} lang={lang} />

      {options.length && displayType ? (
        <>
          <div className="eyebrow" style={{ marginBottom: 8, color: "var(--protein)", fontWeight: 700 }}>
            {tr("nextMeal")} · {formatDateLabel(lang, mealDate)} · {mealTypeLabel(displayType, lang)}
          </div>
          <MealCard
            options={options} startIndex={startIndex} mealType={displayType} mealDate={mealDate}
            plannedBadge={plannedRow ? plannedBadge : undefined} lang={lang}
          />
        </>
      ) : (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, marginBottom: 6 }}>{tr("allDone")}</h3>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}>{tr("checkBackLater")}</p>
        </div>
      )}

      <div className="card" style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: "var(--carbs-bg)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--carbs)" strokeWidth={1.7}>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">{tr("reminderEyebrow")}</div>
          <h3 style={{ fontSize: 17, marginTop: 6 }}>{tr("reminderTitle")}</h3>
        </div>
        <LoadingLink href="/reminders" className="btn ghost" style={{ whiteSpace: "nowrap" }}>{tr("view")}</LoadingLink>
      </div>
    </div>
  );
}
