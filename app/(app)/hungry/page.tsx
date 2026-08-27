import { createClient } from "@/lib/supabaseServer";
import { LoadingLink } from "@/components/LoadingLink";
import { BackButton } from "@/components/BackButton";
import { RetryButton } from "@/components/RetryButton";
import { FoodThumb } from "@/components/FoodThumb";
import { getNutritionContext } from "@/lib/nutritionContext";
import { suggestJSON } from "@/lib/aiSuggest";
import { randomCuisineHint } from "@/lib/cuisineHint";
import { nowInTz } from "@/lib/userTime";

export const maxDuration = 30;

type Option = { title: string; desc: string; ingredients?: { name: string; qty: string }[] };

export default async function HungryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user!.id).single();

  const { summary } = await getNutritionContext(supabase, user!.id);
  const now = nowInTz(profile?.timezone);
  const timeOfDay = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const options = await suggestJSON<Option[]>(
    `Ты подбираешь срочные варианты еды в приложении AI Food Coach для человека, который голоден прямо сейчас — неважно, какой у него по расписанию приём пищи. Каждый раз старайся предлагать разные блюда — избегай одних и тех же типовых вариантов между запросами. Отвечай СТРОГО валидным JSON-массивом без markdown, ровно из 3 элементов в этом порядке и формате: [{"title":"Дома","desc":"...", "ingredients":[{"name":"...","qty":"..."}]}, {"title":"Купить рядом","desc":"..."}, {"title":"Заказать","desc":"...", "ingredients":[{"name":"...","qty":"..."}]}]. desc — 1 короткое предложение с конкретным блюдом.`,
    `${summary} Сейчас ${timeOfDay} по местному времени пользователя. Для разнообразия сегодня ориентируйся на ${randomCuisineHint()} кухню, если это уместно. Дай 3 срочных варианта, уместных именно для этого времени суток: что съесть дома прямо сейчас без готовки, что купить готовое поблизости, и что можно заказать с доставкой — с учётом остатка КБЖУ.`
  );

  return (
    <div>
      <BackButton className="btn ghost" style={{ marginBottom: 16, display: "inline-block" }} />
      <div className="eyebrow" style={{ marginBottom: 6 }}>Срочный режим</div>
      <h1 style={{ fontSize: 22, marginBottom: 18 }}>Я голоден сейчас</h1>

      {!options ? (
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
          <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: "0 0 12px" }}>
            {process.env.ANTHROPIC_API_KEY
              ? "Не получилось подобрать варианты — коуч мог не ответить вовремя."
              : "Подбор ещё не настроен: добавьте ANTHROPIC_API_KEY в переменные окружения Vercel."}
          </p>
          {process.env.ANTHROPIC_API_KEY && <RetryButton />}
        </div>
      ) : (
        options.map((o, i) => (
          <div key={o.title} className="card" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
            <FoodThumb color="var(--protein)" bg="var(--protein-bg)" size={48} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>{o.title}</h3>
              <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: 0 }}>{o.desc}</p>
              {i === 2 && <LoadingLink href="/cart" className="btn" style={{ marginTop: 10, padding: "8px 14px", display: "inline-block" }}>Заказать продукты</LoadingLink>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
