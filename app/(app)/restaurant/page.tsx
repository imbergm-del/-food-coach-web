import { createClient } from "@/lib/supabaseServer";
import { BackButton } from "@/components/BackButton";
import { RetryButton } from "@/components/RetryButton";
import { FoodThumb } from "@/components/FoodThumb";
import { getDisplayMealType } from "@/lib/getDisplayMealType";
import { getNutritionContext } from "@/lib/nutritionContext";
import { MEAL_TYPE_LABELS } from "@/lib/mealTypes";
import { suggestJSON } from "@/lib/aiSuggest";
import { randomCuisineHint } from "@/lib/cuisineHint";

export const maxDuration = 30;

type Pick = { title: string; desc: string; calories: number; protein: number; fat: number; carbs: number };

export default async function RestaurantPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user!.id).single();

  const { type: displayType } = await getDisplayMealType(supabase, user!.id, profile?.timezone);
  const mealLabel = displayType ? MEAL_TYPE_LABELS[displayType] : "приём пищи";
  const { summary } = await getNutritionContext(supabase, user!.id);

  const pick = displayType
    ? await suggestJSON<Pick>(
        `Ты подбираешь лучший заказ в ресторане в приложении AI Food Coach. Каждый раз старайся предлагать разные блюда — избегай одних и тех же типовых вариантов между запросами. Отвечай СТРОГО валидным JSON-объектом без markdown, в этом формате: {"title":"...", "desc":"гарнир/соус одним коротким предложением", "calories":0, "protein":0, "fat":0, "carbs":0}.`,
        `${summary} Сейчас время приёма пищи: ${mealLabel.toLowerCase()}. Пользователь ест вне дома, сегодня в ресторане с уклоном в ${randomCuisineHint()} кухню, если это уместно — подбери ОДНО конкретное блюдо, уместное именно для ${mealLabel.toLowerCase()}а (не предлагай ужинные блюда на завтрак и наоборот), которое впишется в остаток КБЖУ на сегодня.`
      )
    : null;

  return (
    <div className="sheet">
      <BackButton style={{ marginBottom: 16, display: "inline-block" }} />
      <div className="eyebrow" style={{ marginBottom: 6 }}>Режим ресторана · {mealLabel}</div>
      <h1 style={{ fontSize: 22, marginBottom: 16, color: "var(--sheet-text)" }}>Ем вне дома</h1>
      <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 16 }}>
        {["Итальянская", "Японская", "Стейк-хаус", "Грузинская"].map(c => (
          <span key={c} style={{ background: "rgba(255,255,255,.08)", color: "var(--sheet-muted)", margin: 4, fontFamily: "var(--mono)", fontSize: 10.5, padding: "4px 10px", borderRadius: 999 }}>{c}</span>
        ))}
      </div>

      {!displayType ? (
        <div className="sheet-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <p style={{ color: "var(--sheet-muted)", fontSize: 13, margin: 0 }}>Все приёмы на сегодня уже отмечены.</p>
        </div>
      ) : !pick ? (
        <div className="sheet-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <p style={{ color: "var(--sheet-muted)", fontSize: 13, margin: "0 0 12px" }}>
            {process.env.ANTHROPIC_API_KEY
              ? "Не получилось подобрать вариант — коуч мог не ответить вовремя."
              : "Подбор ещё не настроен: добавьте ANTHROPIC_API_KEY в переменные окружения Vercel."}
          </p>
          {process.env.ANTHROPIC_API_KEY && <RetryButton />}
        </div>
      ) : (
        <div className="sheet-card" style={{ alignItems: "flex-start" }}>
          <FoodThumb color="var(--water)" bg="var(--water-bg)" size={52} />
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Лучший выбор сейчас</div>
            <h3 style={{ fontSize: 16, marginBottom: 6, color: "var(--sheet-text)" }}>{pick.title}</h3>
            <p style={{ fontSize: 12.5, color: "var(--sheet-muted)", margin: "0 0 8px" }}>{pick.desc}</p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--sheet-muted)", margin: 0 }}>
              {pick.calories} ккал · Б {pick.protein} · Ж {pick.fat} · У {pick.carbs}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
