import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import { FoodThumb } from "@/components/FoodThumb";
import { getDisplayMealType } from "@/lib/getDisplayMealType";
import { getNutritionContext } from "@/lib/nutritionContext";
import { MEAL_TYPE_LABELS } from "@/lib/mealTypes";
import { suggestJSON } from "@/lib/aiSuggest";
import { randomCuisineHint } from "@/lib/cuisineHint";

type Option = { title: string; desc: string; ingredients?: { name: string; qty: string }[] };

export default async function HungryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { type: displayType } = await getDisplayMealType(supabase, user!.id);
  const mealLabel = displayType ? MEAL_TYPE_LABELS[displayType] : "приём пищи";
  const { summary } = await getNutritionContext(supabase, user!.id);

  const options = displayType
    ? await suggestJSON<Option[]>(
        `Ты подбираешь срочные варианты еды в приложении AI Food Coach для человека, который голоден прямо сейчас. Каждый раз старайся предлагать разные блюда — избегай одних и тех же типовых вариантов между запросами. Отвечай СТРОГО валидным JSON-массивом без markdown, ровно из 3 элементов в этом порядке и формате: [{"title":"Дома","desc":"...", "ingredients":[{"name":"...","qty":"..."}]}, {"title":"Купить рядом","desc":"..."}, {"title":"Заказать","desc":"...", "ingredients":[{"name":"...","qty":"..."}]}]. desc — 1 короткое предложение с конкретным блюдом.`,
        `${summary} Сейчас время приёма пищи: ${mealLabel.toLowerCase()}. Для разнообразия сегодня ориентируйся на ${randomCuisineHint()} кухню, если это уместно. Дай 3 срочных варианта именно под ${mealLabel.toLowerCase()} (не предлагай ужинные блюда на завтрак и наоборот): что съесть дома прямо сейчас без готовки, что купить готовое поблизости, и что можно заказать с доставкой — с учётом остатка КБЖУ.`
      )
    : null;

  return (
    <div className="sheet">
      <Link href="/today" className="btn ghost on-sheet" style={{ marginBottom: 16, display: "inline-block" }}>&larr; Назад</Link>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Срочный режим · {mealLabel}</div>
      <h1 style={{ fontSize: 22, marginBottom: 18, color: "var(--sheet-text)" }}>Я голоден сейчас</h1>

      {!displayType ? (
        <div className="sheet-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <p style={{ color: "var(--sheet-muted)", fontSize: 13, margin: 0 }}>Все приёмы на сегодня уже отмечены — приятного отдыха от еды 🙂</p>
        </div>
      ) : !options ? (
        <div className="sheet-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <p style={{ color: "var(--sheet-muted)", fontSize: 13, margin: 0 }}>
            {process.env.ANTHROPIC_API_KEY
              ? "Не получилось подобрать варианты. Попробуйте обновить страницу."
              : "Подбор ещё не настроен: добавьте ANTHROPIC_API_KEY в переменные окружения Vercel."}
          </p>
        </div>
      ) : (
        options.map((o, i) => (
          <div key={o.title} className="sheet-card">
            <FoodThumb color="var(--protein)" bg="var(--protein-bg)" size={48} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 15, color: "var(--sheet-text)", marginBottom: 4 }}>{o.title}</h3>
              <p style={{ fontSize: 12.5, color: "var(--sheet-muted)", margin: 0 }}>{o.desc}</p>
              {i === 2 && <Link href="/cart" className="btn" style={{ marginTop: 10, padding: "8px 14px", display: "inline-block" }}>Заказать продукты</Link>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
