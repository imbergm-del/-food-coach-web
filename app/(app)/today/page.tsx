import { createClient } from "@/lib/supabaseServer";
import { LoadingLink } from "@/components/LoadingLink";
import { addToCart, logMealEaten } from "./actions";
import { CookingModeTabs } from "./CookingModeTabs";
import { MacroBreakdown } from "@/components/MacroBreakdown";
import { FoodThumb } from "@/components/FoodThumb";
import { RecipeDisclosure } from "./RecipeDisclosure";
import { SubmitButton } from "@/components/SubmitButton";
import { MEAL_TYPE_LABELS, getMealSchedule } from "@/lib/mealTypes";
import { MEAL_POOL, type MealDef } from "@/lib/mealMenu";
import { pickMealForDateAndMode } from "@/lib/mealRotation";
import { getDisplayMealType } from "@/lib/getDisplayMealType";
import { normalizeCookingMode } from "@/lib/cookingMode";
import { scaleMealToTarget } from "@/lib/scaleMeal";
import { nowInTz, todayISOInTz } from "@/lib/userTime";
import { saveName } from "../reminders/actions";

function timeGreeting(tz?: string | null) {
  const hour = nowInTz(tz).getHours();
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

function dateLabel(tz?: string | null) {
  return nowInTz(tz).toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "long" }).toUpperCase();
}

function formatDateLabel(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "long" });
}

export default async function TodayPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const tz = profile?.timezone;

  const today = todayISOInTz(tz);
  const { data: meals } = await supabase
    .from("meals").select("*").eq("user_id", user!.id).eq("date", today).order("id");

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
    plannedRow?.source === "plan" ? "Ваш план на вечер"
    : plannedRow?.source === "week_plan" ? "План на неделю"
    : plannedRow?.source === "change" ? "Ваш выбор"
    : "Из плана";
  const meal: (MealDef & { plannedMealId?: number; badge: string }) | null = !displayType
    ? null
    : plannedRow
      ? {
          title: plannedRow.title ?? "Запланированный приём",
          desc: Array.isArray(plannedRow.ingredients) && plannedRow.ingredients.length
            ? plannedRow.ingredients.map((i: { name: string }) => i.name).join(", ")
            : plannedRow.source === "plan"
              ? "Из вашего плана на вечер"
              : plannedRow.source === "week_plan"
                ? "Из плана на неделю"
                : "Выбрано вами как замена",
          calories: plannedRow.calories ?? 0,
          protein: plannedRow.protein ?? 0,
          fat: plannedRow.fat ?? 0,
          carbs: plannedRow.carbs ?? 0,
          ingredients: plannedRow.ingredients ?? [],
          steps: plannedRow.steps ?? [],
          plannedMealId: plannedRow.id,
          badge: plannedBadge
        }
      : {
          ...scaleMealToTarget(pickMealForDateAndMode(MEAL_POOL[displayType], mealDate, cookingMode, nowInTz(tz).getHours()), displayType, profile?.cal_target ?? 2200),
          badge: "Рецепт под ваш режим"
        };

  const p = profile ?? { protein_target: 125, fat_target: 72, carb_target: 210, cal_target: 2200, name: "друг" };
  const usedProtein = meals?.reduce((s, m) => s + (m.status === "eaten" || m.status === "photo_logged" ? m.protein ?? 0 : 0), 0) ?? 0;
  const usedFat = meals?.reduce((s, m) => s + (m.status === "eaten" || m.status === "photo_logged" ? m.fat ?? 0 : 0), 0) ?? 0;
  const usedCarbs = meals?.reduce((s, m) => s + (m.status === "eaten" || m.status === "photo_logged" ? m.carbs ?? 0 : 0), 0) ?? 0;
  const usedCals = usedProtein * 4 + usedFat * 9 + usedCarbs * 4;
  const caloriesLeft = Math.max(0, p.cal_target - usedCals);
  const eatenMeals = meals?.filter(m => m.status === "eaten" || m.status === "photo_logged") ?? [];

  return (
    <div>
      <div className="eyebrow" style={{ fontWeight: 800 }}>СЕГОДНЯ · {dateLabel(tz)}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "6px 0 10px" }}>
        <h1 style={{ fontSize: 30 }}>{timeGreeting(tz)}, {p.name ?? "друг"}</h1>
        <LoadingLink href="/profile" className="btn ghost" style={{ padding: "8px 10px", borderRadius: "50%" }} ariaLabel="Профиль">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.5-2-3.4-2.3.7a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.3a7.6 7.6 0 0 0-2.6 1.5l-2.3-.7-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.7a7.6 7.6 0 0 0 2.6 1.5l.4 2.3h4l.4-2.3a7.6 7.6 0 0 0 2.6-1.5l2.3.7 2-3.4-1.9-1.5Z" /></svg>
        </LoadingLink>
      </div>
      {!profile?.name && (
        <div className="card" style={{ marginBottom: 16, borderLeft: "5px solid var(--protein)" }}>
          <p style={{ fontSize: 13.5, margin: "0 0 10px" }}>Как к вам обращаться?</p>
          <form action={saveName} style={{ display: "flex", gap: 8 }}>
            <input
              name="name" type="text" placeholder="Ваше имя" autoFocus
              style={{
                flex: 1, border: "1px solid var(--line-strong)", borderRadius: 12, padding: "11px 14px",
                fontFamily: "var(--sans)", fontSize: 14, background: "var(--card)", color: "var(--ink)"
              }}
            />
            <SubmitButton className="btn" style={{ width: "auto" }} pendingText="…">Сохранить</SubmitButton>
          </form>
        </div>
      )}
      {isTomorrow && (
        <p style={{ fontSize: 12.5, color: "var(--protein)", fontWeight: 700, margin: "-8px 0 16px" }}>
          Поздний час — приёмы на сегодня позади, дальше речь про завтра, {formatDateLabel(mealDate)}.
        </p>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <MacroBreakdown
          meals={eatenMeals} usedCals={usedCals} usedProtein={usedProtein} usedFat={usedFat} usedCarbs={usedCarbs}
          calTarget={p.cal_target} proteinTarget={p.protein_target} fatTarget={p.fat_target} carbTarget={p.carb_target}
          caloriesLeft={caloriesLeft}
        />
      </div>

      {plannedRow && plannedRow.source !== "week_plan" && (
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 10px" }}>
          Этот приём вы задали вручную — но время на готовку всё ещё можно поменять ниже.
        </p>
      )}
      <CookingModeTabs current={cookingMode} mealType={displayType} mealDate={mealDate} />

      {meal && displayType ? (
        <>
          <div className="eyebrow" style={{ marginBottom: 8, color: "var(--protein)", fontWeight: 700 }}>
            Следующий приём · {formatDateLabel(mealDate)} · {MEAL_TYPE_LABELS[displayType]}
          </div>
          <div className="card" style={{ marginBottom: 16, borderLeft: "5px solid var(--protein)" }}>
            <div className="mealtop" style={{ marginBottom: 12 }}>
              <FoodThumb color="var(--protein)" bg="var(--protein-bg)" photoUrl={meal.photoUrl} alt={meal.title} />
              <div>
                <span className="mealbadge">{meal.badge}</span>
                <h3 style={{ fontSize: 20, marginBottom: 6 }}>{meal.title}</h3>
                <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: 0 }}>{meal.desc}</p>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "0 0 16px" }}>
              {[
                [`${meal.calories} ккал`, "var(--ink-soft)", "var(--paper2)"],
                [`Б ${meal.protein}`, "var(--protein)", "var(--protein-bg)"],
                [`Ж ${meal.fat}`, "var(--fat-ink)", "var(--fat-bg)"],
                [`У ${meal.carbs}`, "var(--carbs)", "var(--carbs-bg)"]
              ].map(([text, color, bg]) => (
                <span key={text} style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 600, color, background: bg, padding: "5px 10px", borderRadius: 999 }}>
                  {text}
                </span>
              ))}
            </div>
            <RecipeDisclosure ingredients={meal.ingredients} steps={meal.steps} />
            <div className="actionrow" style={{ marginBottom: 10 }}>
              <form action={logMealEaten} style={{ flex: 1 }}>
                {meal.plannedMealId && <input type="hidden" name="mealId" value={meal.plannedMealId} />}
                <input type="hidden" name="title" value={meal.title} />
                <input type="hidden" name="mealType" value={displayType} />
                <input type="hidden" name="date" value={mealDate} />
                <input type="hidden" name="ingredients" value={JSON.stringify(meal.ingredients)} />
                <input type="hidden" name="calories" value={meal.calories} />
                <input type="hidden" name="protein" value={meal.protein} />
                <input type="hidden" name="fat" value={meal.fat} />
                <input type="hidden" name="carbs" value={meal.carbs} />
                <SubmitButton className="actbtn" pendingText="…">Съел</SubmitButton>
              </form>
              <LoadingLink href="/change" className="actbtn ghost">Заменить</LoadingLink>
            </div>
            <LoadingLink
              href="/more" className="btn ghost block"
              style={{ textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
              </svg>
              Ещё варианты — фото, ресторан, голоден сейчас
            </LoadingLink>
          </div>
        </>
      ) : (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, marginBottom: 6 }}>Все приёмы отмечены ✓</h3>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}>Загляните позже — план продолжится дальше по приёмам.</p>
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
          <div className="eyebrow">Напоминание придёт сегодня в 20:00</div>
          <h3 style={{ fontSize: 17, marginTop: 6 }}>Ваше питание на завтра готово</h3>
        </div>
        <LoadingLink href="/reminders" className="btn ghost" style={{ whiteSpace: "nowrap" }}>Смотреть</LoadingLink>
      </div>

      {meal && (
        <form action={addToCart} style={{ display: "none" }} id="order-form">
          <input type="hidden" name="ingredients" value={JSON.stringify(meal.ingredients)} />
        </form>
      )}
    </div>
  );
}
