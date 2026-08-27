import { createClient } from "@/lib/supabaseServer";
import { BackButton } from "@/components/BackButton";
import { FoodThumb } from "@/components/FoodThumb";
import { getDisplayMealType } from "@/lib/getDisplayMealType";
import { MEAL_TYPE_LABELS } from "@/lib/mealTypes";
import { MEALS_BY_MODE, MEAL_ALTERNATIVES } from "@/lib/mealMenu";
import { scaleMealToTarget } from "@/lib/scaleMeal";
import { chooseAlternative } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { normalizeCookingMode } from "@/lib/cookingMode";

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

  // Показываем ту сторону пары «основной рецепт / альтернатива», которая сейчас
  // НЕ отображается на «Сегодня» — так «Заменить» переключает туда-обратно.
  const primary = displayType ? scaleMealToTarget(MEALS_BY_MODE[cookingMode][displayType], displayType, calTarget) : null;
  const alternative = displayType ? scaleMealToTarget(MEAL_ALTERNATIVES[cookingMode][displayType], displayType, calTarget) : null;
  const alt = primary && alternative ? (plannedTitle === alternative.title ? primary : alternative) : null;

  return (
    <div className="sheet">
      <BackButton style={{ marginBottom: 16, display: "inline-block" }} />
      <div className="eyebrow" style={{ marginBottom: 6 }}>Замена блюда · {mealLabel}</div>
      <h1 style={{ fontSize: 22, marginBottom: 16, color: "var(--sheet-text)" }}>Другой вариант</h1>

      {!displayType || !alt ? (
        <div className="sheet-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <p style={{ color: "var(--sheet-muted)", fontSize: 13, margin: 0 }}>Все приёмы на сегодня уже отмечены — заменять нечего.</p>
        </div>
      ) : (
        <div className="sheet-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
            <FoodThumb color="var(--protein)" bg="var(--protein-bg)" size={48} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 16, color: "var(--sheet-text)" }}>{alt.title}</h3>
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--sheet-muted)", margin: "4px 0 0" }}>
                {alt.calories} ккал · Б {alt.protein} · Ж {alt.fat} · У {alt.carbs}
              </p>
            </div>
          </div>
          <ul style={{ margin: "0 0 14px", padding: "0 0 0 18px" }}>
            {alt.ingredients.map(i => (
              <li key={i.name} style={{ fontSize: 12.5, color: "var(--sheet-muted)", marginBottom: 2 }}>
                {i.name} — {i.qty}
              </li>
            ))}
          </ul>
          {alt.steps.length > 0 && (
            <ol style={{ margin: "0 0 14px", padding: "0 0 0 18px" }}>
              {alt.steps.map((step, i) => (
                <li key={i} style={{ fontSize: 12.5, color: "var(--sheet-muted)", marginBottom: 4, lineHeight: 1.5 }}>
                  {step}
                </li>
              ))}
            </ol>
          )}
          <form action={chooseAlternative}>
            <input type="hidden" name="mealType" value={displayType} />
            <input type="hidden" name="date" value={mealDate} />
            <input type="hidden" name="title" value={alt.title} />
            <input type="hidden" name="calories" value={alt.calories} />
            <input type="hidden" name="protein" value={alt.protein} />
            <input type="hidden" name="fat" value={alt.fat} />
            <input type="hidden" name="carbs" value={alt.carbs} />
            <input type="hidden" name="ingredients" value={JSON.stringify(alt.ingredients)} />
            <SubmitButton>Выбрать это блюдо</SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
