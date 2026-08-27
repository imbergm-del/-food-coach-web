import { createClient } from "@/lib/supabaseServer";
import { LoadingLink } from "@/components/LoadingLink";
import { addToCart, logMealEaten } from "./actions";
import { CookingModeTabs } from "./CookingModeTabs";
import { MacroDial } from "@/components/MacroDial";
import { FoodThumb } from "@/components/FoodThumb";
import { RecipeDisclosure } from "./RecipeDisclosure";
import { SubmitButton } from "@/components/SubmitButton";
import { MEAL_TYPE_LABELS } from "@/lib/mealTypes";
import { MEALS_BY_MODE, type MealDef } from "@/lib/mealMenu";
import { getDisplayMealType } from "@/lib/getDisplayMealType";
import { normalizeCookingMode } from "@/lib/cookingMode";

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

function dateLabel() {
  return new Date().toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "long" }).toUpperCase();
}

export default async function TodayPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  const today = new Date().toISOString().slice(0, 10);
  const { data: meals } = await supabase
    .from("meals").select("*").eq("user_id", user!.id).eq("date", today).order("id");

  const cookingMode = normalizeCookingMode(profile?.cooking_mode);
  const menu = MEALS_BY_MODE[cookingMode];
  const { type: displayType, date: mealDate } = await getDisplayMealType(supabase, user!.id);
  const isTomorrow = mealDate !== today;

  const mealDateMeals = isTomorrow
    ? (await supabase.from("meals").select("*").eq("user_id", user!.id).eq("date", mealDate).order("id")).data
    : meals;

  // Если этот приём был спланирован вечером заранее (см. «Напоминания»), покажем его вместо общей подсказки
  const plannedRow = displayType ? mealDateMeals?.find(m => m.meal_type === displayType && m.status === "planned") : undefined;
  const meal: (MealDef & { plannedMealId?: number }) | null = !displayType
    ? null
    : plannedRow
      ? {
          title: plannedRow.title ?? "Запланированный приём",
          desc: Array.isArray(plannedRow.ingredients) && plannedRow.ingredients.length
            ? plannedRow.ingredients.map((i: { name: string }) => i.name).join(", ")
            : plannedRow.source === "plan"
              ? "Из вашего плана на вечер"
              : "Выбрано вами как замена",
          calories: plannedRow.calories ?? 0,
          protein: plannedRow.protein ?? 0,
          fat: plannedRow.fat ?? 0,
          carbs: plannedRow.carbs ?? 0,
          ingredients: plannedRow.ingredients ?? [],
          steps: [],
          plannedMealId: plannedRow.id
        }
      : menu[displayType];

  const p = profile ?? { protein_target: 125, fat_target: 72, carb_target: 210, cal_target: 2200, name: "друг" };
  const usedProtein = meals?.reduce((s, m) => s + (m.status === "eaten" || m.status === "photo_logged" ? m.protein ?? 0 : 0), 0) ?? 0;
  const usedFat = meals?.reduce((s, m) => s + (m.status === "eaten" || m.status === "photo_logged" ? m.fat ?? 0 : 0), 0) ?? 0;
  const usedCarbs = meals?.reduce((s, m) => s + (m.status === "eaten" || m.status === "photo_logged" ? m.carbs ?? 0 : 0), 0) ?? 0;
  const usedCals = usedProtein * 4 + usedFat * 9 + usedCarbs * 4;
  const caloriesLeft = Math.max(0, p.cal_target - usedCals);

  return (
    <div>
      <div className="eyebrow" style={{ fontWeight: 800 }}>СЕГОДНЯ · {dateLabel()}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "6px 0 10px" }}>
        <h1 style={{ fontSize: 30 }}>{timeGreeting()}, {p.name ?? "друг"}</h1>
        <LoadingLink href="/profile" className="btn ghost" style={{ padding: "8px 10px", borderRadius: "50%" }} ariaLabel="Профиль">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.5-2-3.4-2.3.7a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.3a7.6 7.6 0 0 0-2.6 1.5l-2.3-.7-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.7a7.6 7.6 0 0 0 2.6 1.5l.4 2.3h4l.4-2.3a7.6 7.6 0 0 0 2.6-1.5l2.3.7 2-3.4-1.9-1.5Z" /></svg>
        </LoadingLink>
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 16px" }}>
        Норма на день: {p.cal_target} ккал · Б {p.protein_target} · Ж {p.fat_target} · У {p.carb_target}
      </p>

      <div
        className="card"
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16,
          background: "radial-gradient(120% 100% at 50% 0%, var(--protein-bg) 0%, var(--card) 68%)"
        }}
      >
        <MacroDial
          proteinPct={usedProtein / p.protein_target}
          fatPct={usedFat / p.fat_target}
          carbsPct={usedCarbs / p.carb_target}
          caloriesLeft={caloriesLeft}
        />
        <div style={{ display: "flex", width: "100%", marginTop: 18, gap: 8 }}>
          {([
            ["Белок", usedProtein, p.protein_target, "var(--protein)", "var(--protein-bg)"],
            ["Жиры", usedFat, p.fat_target, "var(--fat-ink)", "var(--fat-bg)"],
            ["Углеводы", usedCarbs, p.carb_target, "var(--carbs)", "var(--carbs-bg)"]
          ] as [string, number, number, string, string][]).map(([label, used, target, color, bg]) => (
            <div key={label} style={{ flex: 1, textAlign: "center", background: bg, borderRadius: 14, padding: "10px 4px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 17, fontWeight: 700, color }}>
                {used}<span style={{ fontSize: 12, fontWeight: 500, opacity: 0.75 }}>/{target}</span>
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color, opacity: 0.85, marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {plannedRow ? (
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 16px" }}>
          Этот приём вы задали вручную — время на готовку тут ни при чём.
        </p>
      ) : (
        <CookingModeTabs current={cookingMode} />
      )}

      {meal && displayType ? (
        <>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Следующий приём{isTomorrow ? " · Завтра" : ""} · {MEAL_TYPE_LABELS[displayType]}
          </div>
          <div className="card" style={{ marginBottom: 16, borderLeft: "5px solid var(--protein)" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 12 }}>
              <FoodThumb color="var(--protein)" bg="var(--protein-bg)" photoUrl={meal.photoUrl} alt={meal.title} />
              <div>
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
            <div style={{ display: "flex", gap: 10 }}>
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
                <SubmitButton>Съел(а)</SubmitButton>
              </form>
              <LoadingLink href="/more" className="btn ghost" style={{ flex: 1, textAlign: "center" }}>Другое &#8943;</LoadingLink>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, marginBottom: 6 }}>Все приёмы отмечены ✓</h3>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}>Загляните позже — план продолжится дальше по приёмам.</p>
        </div>
      )}

      <div className="card" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
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
