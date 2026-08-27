import { createClient } from "@/lib/supabaseServer";
import { BackButton } from "@/components/BackButton";
import { getDisplayMealType } from "@/lib/getDisplayMealType";
import { MEAL_TYPE_LABELS } from "@/lib/mealTypes";
import { MEAL_POOL } from "@/lib/mealMenu";
import { pickMealForDateAndMode } from "@/lib/mealRotation";
import { scaleMealToTarget } from "@/lib/scaleMeal";
import { normalizeCookingMode } from "@/lib/cookingMode";
import { ChangePicker } from "./ChangePicker";

export default async function ChangePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  const { type: displayType, date: mealDate } = await getDisplayMealType(supabase, user!.id, profile?.timezone);
  const mealLabel = displayType ? MEAL_TYPE_LABELS[displayType] : "приём пищи";
  const cookingMode = normalizeCookingMode(profile?.cooking_mode);
  const calTarget = profile?.cal_target ?? 2200;

  const { data: mealsForSlot } = displayType
    ? await supabase.from("meals").select("title, status").eq("user_id", user!.id).eq("date", mealDate).eq("meal_type", displayType)
    : { data: null };
  const plannedTitle = mealsForSlot?.find(m => m.status === "planned")?.title;

  // Вся подборка на этот приём (минимум 5 блюд, без фильтра по режиму готовки —
  // тут человек уже осознанно перебирает варианты) — «Заменить» листает её на
  // клиенте, без обращений к серверу, и ничего не сохраняет, пока не нажали
  // «Выбрать это блюдо».
  const scaledOptions = displayType
    ? MEAL_POOL[displayType].map(def => scaleMealToTarget(def, displayType, calTarget))
    : [];

  const startIndex = (() => {
    if (!displayType || !scaledOptions.length) return 0;
    const currentTitle = plannedTitle ?? pickMealForDateAndMode(MEAL_POOL[displayType], mealDate, cookingMode).title;
    const currentIndex = scaledOptions.findIndex(m => m.title === currentTitle);
    return currentIndex === -1 ? 0 : (currentIndex + 1) % scaledOptions.length;
  })();

  return (
    <div>
      <BackButton className="btn ghost" style={{ marginBottom: 16, display: "inline-block" }} />
      <div className="eyebrow" style={{ marginBottom: 6 }}>Замена блюда · {mealLabel}</div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Другой вариант</h1>

      {!displayType || !scaledOptions.length ? (
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
          <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: 0 }}>Все приёмы на сегодня уже отмечены — заменять нечего.</p>
        </div>
      ) : (
        <ChangePicker options={scaledOptions} startIndex={startIndex} mealType={displayType} mealDate={mealDate} />
      )}
    </div>
  );
}
