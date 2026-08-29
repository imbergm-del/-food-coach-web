import { createClient } from "@/lib/supabaseServer";
import { BackButton } from "@/components/BackButton";
import { RetryButton } from "@/components/RetryButton";
import { FoodThumb } from "@/components/FoodThumb";
import { getDisplayMealType } from "@/lib/getDisplayMealType";
import { getNutritionContext } from "@/lib/nutritionContext";
import { mealTypeLabel } from "@/lib/mealTypes";
import { suggestJSON } from "@/lib/aiSuggest";
import { randomCuisineHint } from "@/lib/cuisineHint";
import { getLang } from "@/lib/language";

export const maxDuration = 30;

type Pick = { title: string; desc: string; calories: number; protein: number; fat: number; carbs: number };

export default async function RestaurantPage() {
  const lang = getLang();
  const en = lang === "en";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user!.id).single();

  const { type: displayType } = await getDisplayMealType(supabase, user!.id, profile?.timezone);
  const mealLabel = displayType ? mealTypeLabel(displayType, lang) : (en ? "meal" : "приём пищи");
  const { summary } = await getNutritionContext(supabase, user!.id);
  const langLine = en ? "Respond in English (including the dish title and description). " : "";

  const pick = displayType
    ? await suggestJSON<Pick>(
        `${langLine}Ты подбираешь лучший заказ в ресторане в приложении AI Food Coach. Каждый раз старайся предлагать разные блюда — избегай одних и тех же типовых вариантов между запросами. Отвечай СТРОГО валидным JSON-объектом без markdown, в этом формате: {"title":"...", "desc":"гарнир/соус одним коротким предложением", "calories":0, "protein":0, "fat":0, "carbs":0}.`,
        `${summary} Сейчас время приёма пищи: ${mealLabel.toLowerCase()}. Пользователь ест вне дома, сегодня в ресторане с уклоном в ${randomCuisineHint()} кухню, если это уместно — подбери ОДНО конкретное блюдо, уместное именно для ${mealLabel.toLowerCase()}а (не предлагай ужинные блюда на завтрак и наоборот), которое впишется в остаток КБЖУ на сегодня.`
      )
    : null;

  return (
    <div>
      <BackButton className="btn ghost" style={{ marginBottom: 16, display: "inline-block" }} />
      <div className="eyebrow" style={{ marginBottom: 6 }}>{en ? "Restaurant mode" : "Режим ресторана"} · {mealLabel}</div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>{en ? "Eating out" : "Ем вне дома"}</h1>

      {!displayType ? (
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
          <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: 0 }}>{en ? "All meals for today are already logged." : "Все приёмы на сегодня уже отмечены."}</p>
        </div>
      ) : !pick ? (
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
          <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: "0 0 12px" }}>
            {process.env.ANTHROPIC_API_KEY
              ? (en ? "Couldn't come up with a pick — the coach may not have responded in time." : "Не получилось подобрать вариант — коуч мог не ответить вовремя.")
              : (en ? "Suggestions aren't set up yet: add ANTHROPIC_API_KEY to Vercel environment variables." : "Подбор ещё не настроен: добавьте ANTHROPIC_API_KEY в переменные окружения Vercel.")}
          </p>
          {process.env.ANTHROPIC_API_KEY && <RetryButton />}
        </div>
      ) : (
        <div className="card" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <FoodThumb color="var(--water)" bg="var(--water-bg)" size={52} />
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>{en ? "Best pick right now" : "Лучший выбор сейчас"}</div>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>{pick.title}</h3>
            <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 8px" }}>{pick.desc}</p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-soft)", margin: 0 }}>
              {pick.calories} {en ? "kcal" : "ккал"} · {en ? "P" : "Б"} {pick.protein} · {en ? "F" : "Ж"} {pick.fat} · {en ? "C" : "У"} {pick.carbs}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
