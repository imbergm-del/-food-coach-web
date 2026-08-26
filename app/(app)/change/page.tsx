import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import { FoodThumb } from "@/components/FoodThumb";
import { getDisplayMealType } from "@/lib/getDisplayMealType";
import { MEAL_TYPE_LABELS } from "@/lib/mealTypes";
import { MEALS_BY_MODE } from "@/lib/mealMenu";
import { suggestJSON } from "@/lib/aiSuggest";
import { chooseAlternative } from "./actions";

type Alt = { title: string; calories: number; protein: number; fat: number; carbs: number };

const COOKING_TIME_LABEL: Record<string, string> = {
  "0": "нет времени — только готовое, без плиты",
  "5": "5 минут на сборку",
  "15": "15–20 минут, есть плита/духовка"
};

export default async function ChangePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  const displayType = await getDisplayMealType(supabase, user!.id);
  const mealLabel = displayType ? MEAL_TYPE_LABELS[displayType] : "приём пищи";
  const cookingMode = profile?.cooking_mode ?? "0";
  const currentMeal = displayType ? MEALS_BY_MODE[cookingMode]?.[displayType] : undefined;

  const alts = displayType
    ? await suggestJSON<Alt[]>(
        `Ты подбираешь замену блюду в приложении AI Food Coach. Пользователь ленивый и не хочет тратить время на готовку. Отвечай СТРОГО валидным JSON-массивом без markdown и пояснений, ровно в этом формате: [{"title":"...", "calories":0, "protein":0, "fat":0, "carbs":0}] — три варианта.`,
        `Приём пищи: ${mealLabel}. Текущее предложенное блюдо: ${currentMeal?.title ?? "не задано"} (${currentMeal?.calories ?? "?"} ккал, Б${currentMeal?.protein ?? "?"} Ж${currentMeal?.fat ?? "?"} У${currentMeal?.carbs ?? "?"}). Время на готовку: ${COOKING_TIME_LABEL[cookingMode]}. Предложи 3 альтернативы, которые уместны именно для приёма «${mealLabel.toLowerCase()}» (не предлагай ужинные блюда на завтрак и наоборот), с похожим на текущее блюдо КБЖУ, и подходящие под время на готовку.`
      )
    : null;

  return (
    <div className="sheet">
      <Link href="/today" className="btn ghost on-sheet" style={{ marginBottom: 16, display: "inline-block" }}>&larr; Назад</Link>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Замена блюда · {mealLabel}</div>
      <h1 style={{ fontSize: 22, marginBottom: 16, color: "var(--sheet-text)" }}>Похожие по КБЖУ варианты</h1>

      {!displayType ? (
        <div className="sheet-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <p style={{ color: "var(--sheet-muted)", fontSize: 13, margin: 0 }}>Все приёмы на сегодня уже отмечены — заменять нечего.</p>
        </div>
      ) : !alts ? (
        <div className="sheet-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <p style={{ color: "var(--sheet-muted)", fontSize: 13, margin: 0 }}>
            {process.env.ANTHROPIC_API_KEY
              ? "Не получилось подобрать варианты. Попробуйте обновить страницу."
              : "Подбор альтернатив ещё не настроен: добавьте ANTHROPIC_API_KEY в переменные окружения Vercel."}
          </p>
        </div>
      ) : (
        alts.map(a => (
          <div key={a.title} className="sheet-card">
            <FoodThumb color="var(--protein)" bg="var(--protein-bg)" size={48} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 15, color: "var(--sheet-text)" }}>{a.title}</h3>
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--sheet-muted)", margin: "4px 0 0" }}>
                {a.calories} ккал · Б {a.protein} · Ж {a.fat} · У {a.carbs}
              </p>
            </div>
            <form action={chooseAlternative}>
              <input type="hidden" name="mealType" value={displayType} />
              <input type="hidden" name="title" value={a.title} />
              <input type="hidden" name="calories" value={a.calories} />
              <input type="hidden" name="protein" value={a.protein} />
              <input type="hidden" name="fat" value={a.fat} />
              <input type="hidden" name="carbs" value={a.carbs} />
              <button className="btn" style={{ padding: "8px 14px" }} type="submit">Выбрать</button>
            </form>
          </div>
        ))
      )}
    </div>
  );
}
