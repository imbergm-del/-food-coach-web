import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import { addToCart, logMealEaten } from "./actions";
import { CookingModeTabs } from "./CookingModeTabs";
import { MacroDial } from "@/components/MacroDial";
import { FoodThumb } from "@/components/FoodThumb";
import { RecipeDisclosure } from "./RecipeDisclosure";
import { MEAL_SEQUENCE, MEAL_TYPE_LABELS, currentMealType, type MealType } from "@/lib/mealTypes";

type MealDef = {
  title: string; desc: string; calories: number; protein: number; fat: number; carbs: number;
  photoUrl?: string; ingredients: { name: string; qty: string }[]; steps: string[];
};

const MEALS_BY_MODE: Record<string, Record<MealType, MealDef>> = {
  "0": {
    breakfast: {
      title: "Йогурт с ягодами и гранолой",
      desc: "Готовый греч. йогурт, замороженные ягоды, гранола",
      calories: 350, protein: 25, fat: 10, carbs: 40,
      ingredients: [{ name: "Греч. йогурт", qty: "300 г" }, { name: "Ягоды замороженные", qty: "100 г" }, { name: "Гранола", qty: "30 г" }],
      steps: ["Разморозьте ягоды 1 минуту в микроволновке (или дайте оттаять).", "Смешайте йогурт с ягодами и гранолой в миске."]
    },
    lunch: {
      title: "Быстрая тарелка без готовки",
      desc: "Готовая курица-гриль, греч. йогурт, огурцы, хлебцы",
      calories: 480, protein: 46, fat: 14, carbs: 38,
      ingredients: [{ name: "Курица-гриль готовая", qty: "300 г" }, { name: "Греч. йогурт", qty: "1 шт" }, { name: "Огурцы", qty: "2 шт" }, { name: "Хлебцы", qty: "1 уп." }],
      steps: ["Курицу можно есть холодной или разогреть 1–2 минуты в микроволновке.", "Огурцы ополосните и нарежьте дольками.", "Выложите курицу, йогурт, огурцы и хлебцы на тарелку — готово."]
    },
    snack: {
      title: "Протеиновый батончик и яблоко",
      desc: "Готовка не нужна вообще",
      calories: 220, protein: 20, fat: 8, carbs: 22,
      ingredients: [{ name: "Протеиновый батончик", qty: "1 шт" }, { name: "Яблоко", qty: "1 шт" }],
      steps: ["Просто съешьте — готовить не нужно."]
    },
    dinner: {
      title: "Тарелка с индейкой и овощами",
      desc: "Готовая нарезка индейки, свежие овощи, хумус",
      calories: 430, protein: 40, fat: 16, carbs: 28,
      ingredients: [{ name: "Индейка нарезка готовая", qty: "200 г" }, { name: "Овощи свежие", qty: "200 г" }, { name: "Хумус", qty: "3 ст.л." }],
      steps: ["Выложите нарезку индейки и овощи на тарелку.", "Добавьте хумус в качестве соуса."]
    }
  },
  "5": {
    breakfast: {
      title: "Овсянка на 5 минут",
      desc: "Хлопья быстрого приготовления, молоко, банан",
      calories: 380, protein: 14, fat: 8, carbs: 62,
      ingredients: [{ name: "Овсяные хлопья быстрые", qty: "60 г" }, { name: "Молоко", qty: "200 мл" }, { name: "Банан", qty: "1 шт" }],
      steps: ["Залейте хлопья горячим молоком или водой, оставьте на 3 минуты.", "Нарежьте банан сверху."]
    },
    lunch: {
      title: "Собрать за 5 минут",
      desc: "Тунец, авокадо, лаваш, свежие овощи",
      calories: 510, protein: 42, fat: 18, carbs: 40,
      ingredients: [{ name: "Тунец консервир.", qty: "1 банка" }, { name: "Авокадо", qty: "1 шт" }, { name: "Лаваш", qty: "1 шт" }, { name: "Овощи свежие", qty: "150 г" }],
      steps: ["Слейте жидкость с тунца и разомните его вилкой прямо в банке.", "Авокадо и овощи нарежьте некрупно.", "Выложите тунец, авокадо и овощи на лаваш и сверните в рулет."]
    },
    snack: {
      title: "Творог с мёдом",
      desc: "Просто смешать",
      calories: 230, protein: 24, fat: 6, carbs: 20,
      ingredients: [{ name: "Творог 5%", qty: "200 г" }, { name: "Мёд", qty: "1 ч.л." }],
      steps: ["Смешайте творог с мёдом — готово."]
    },
    dinner: {
      title: "Салат с тунцом и фасолью",
      desc: "Тунец, фасоль, листья салата, масло",
      calories: 420, protein: 38, fat: 14, carbs: 36,
      ingredients: [{ name: "Тунец консервир.", qty: "1 банка" }, { name: "Фасоль консервир.", qty: "150 г" }, { name: "Листья салата", qty: "100 г" }, { name: "Оливковое масло", qty: "1 ст.л." }],
      steps: ["Слейте жидкость с тунца и фасоли.", "Смешайте всё с листьями салата и маслом."]
    }
  },
  "15": {
    breakfast: {
      title: "Омлет с овощами",
      desc: "Яйца, шпинат, тост",
      calories: 360, protein: 24, fat: 20, carbs: 20,
      ingredients: [{ name: "Яйца", qty: "2 шт" }, { name: "Шпинат", qty: "50 г" }, { name: "Тост цельнозерн.", qty: "1 шт" }],
      steps: ["Взбейте яйца, добавьте шпинат.", "Жарьте на среднем огне 4–5 минут, помешивая.", "Подавайте с тостом."]
    },
    lunch: {
      title: "Боул с курицей и рисом",
      desc: "200 г курицы, 150 г риса, 150 г овощей, 1 ч.л. оливкового масла",
      calories: 520, protein: 48, fat: 12, carbs: 54,
      ingredients: [{ name: "Куриная грудка", qty: "200 г" }, { name: "Рис", qty: "150 г" }, { name: "Овощи замороженные", qty: "150 г" }, { name: "Оливковое масло", qty: "1 шт" }],
      steps: ["Разогрейте рис (готовый пакет — 2 минуты в микроволновке, или заранее сваренный).", "Обжарьте или разогрейте курицу на сковороде 3–4 минуты до готовности.", "Разморозьте овощи — 2 минуты в микроволновке или на той же сковороде.", "Соберите всё в тарелке и сбрызните оливковым маслом."]
    },
    snack: {
      title: "Тосты с авокадо и яйцом пашот",
      desc: "Хлеб, авокадо, яйцо",
      calories: 320, protein: 16, fat: 18, carbs: 26,
      ingredients: [{ name: "Хлеб цельнозерн.", qty: "2 куска" }, { name: "Авокадо", qty: "1 шт" }, { name: "Яйцо", qty: "1 шт" }],
      steps: ["Поджарьте тосты.", "Разомните авокадо и намажьте на тосты.", "Сварите яйцо пашот 3 минуты и выложите сверху."]
    },
    dinner: {
      title: "Стейк с овощами на сковороде",
      desc: "Говяжий стейк, овощи на гриле",
      calories: 520, protein: 45, fat: 22, carbs: 20,
      ingredients: [{ name: "Говяжий стейк", qty: "200 г" }, { name: "Овощи на гриле", qty: "200 г" }, { name: "Оливковое масло", qty: "1 ст.л." }],
      steps: ["Разогрейте сковороду с маслом.", "Обжарьте стейк 3–4 минуты с каждой стороны.", "Обжарьте овощи рядом 5–7 минут."]
    }
  }
};

export default async function TodayPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  const today = new Date().toISOString().slice(0, 10);
  const { data: meals } = await supabase
    .from("meals").select("*").eq("user_id", user!.id).eq("date", today).order("id");

  const cookingMode = profile?.cooking_mode ?? "0";
  const menu = MEALS_BY_MODE[cookingMode] ?? MEALS_BY_MODE["0"];

  const loggedTypes = new Set((meals ?? []).filter(m => m.status !== "planned").map(m => m.meal_type));
  const clockType = currentMealType();
  const displayType = !loggedTypes.has(clockType)
    ? clockType
    : MEAL_SEQUENCE.find(t => !loggedTypes.has(t));
  const meal = displayType ? menu[displayType] : null;

  const p = profile ?? { protein_target: 125, fat_target: 72, carb_target: 210, cal_target: 2200, name: "друг" };
  const usedProtein = meals?.reduce((s, m) => s + (m.status === "eaten" || m.status === "photo_logged" ? m.protein ?? 0 : 0), 0) ?? 0;
  const usedFat = meals?.reduce((s, m) => s + (m.status === "eaten" || m.status === "photo_logged" ? m.fat ?? 0 : 0), 0) ?? 0;
  const usedCarbs = meals?.reduce((s, m) => s + (m.status === "eaten" || m.status === "photo_logged" ? m.carbs ?? 0 : 0), 0) ?? 0;
  const usedCals = usedProtein * 4 + usedFat * 9 + usedCarbs * 4;
  const caloriesLeft = Math.max(0, p.cal_target - usedCals);

  return (
    <div>
      <div className="eyebrow">СЕГОДНЯ</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "6px 0 22px" }}>
        <h1 style={{ fontSize: 30 }}>С добрым утром, {p.name ?? "друг"}</h1>
        <Link href="/profile" className="btn ghost" style={{ padding: "8px 10px", borderRadius: "50%" }} aria-label="Профиль">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.5-2-3.4-2.3.7a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.3a7.6 7.6 0 0 0-2.6 1.5l-2.3-.7-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.7a7.6 7.6 0 0 0 2.6 1.5l.4 2.3h4l.4-2.3a7.6 7.6 0 0 0 2.6-1.5l2.3.7 2-3.4-1.9-1.5Z" /></svg>
        </Link>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, letterSpacing: ".05em", padding: "5px 12px", borderRadius: 999, background: "var(--protein-bg)", color: "var(--protein)", marginBottom: 12 }}>
          ДЕНЬ A · СИЛОВАЯ
        </span>
        <MacroDial
          proteinPct={usedProtein / p.protein_target}
          fatPct={usedFat / p.fat_target}
          carbsPct={usedCarbs / p.carb_target}
          caloriesLeft={caloriesLeft}
        />
        <div style={{ display: "flex", width: "100%", marginTop: 14, gap: 14 }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--protein)", margin: "0 auto 4px" }} />
            <div className="macrolabel" style={{ justifyContent: "center" }}>Белок {usedProtein}/{p.protein_target}</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--fat)", margin: "0 auto 4px" }} />
            <div className="macrolabel" style={{ justifyContent: "center" }}>Жиры {usedFat}/{p.fat_target}</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--carbs)", margin: "0 auto 4px" }} />
            <div className="macrolabel" style={{ justifyContent: "center" }}>Углев. {usedCarbs}/{p.carb_target}</div>
          </div>
        </div>
      </div>

      <CookingModeTabs current={cookingMode} />

      {meal && displayType ? (
        <>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Следующий приём · {MEAL_TYPE_LABELS[displayType]}</div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 12 }}>
              <FoodThumb color="var(--protein)" bg="var(--protein-bg)" photoUrl={meal.photoUrl} alt={meal.title} />
              <div>
                <h3 style={{ fontSize: 20, marginBottom: 6 }}>{meal.title}</h3>
                <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: 0 }}>{meal.desc}</p>
              </div>
            </div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 500, letterSpacing: ".01em", color: "var(--ink-soft)", margin: "0 0 16px" }}>
              {meal.calories} ккал · Б {meal.protein} · Ж {meal.fat} · У {meal.carbs}
            </p>
            <RecipeDisclosure steps={meal.steps} />
            <div style={{ display: "flex", gap: 10 }}>
              <form action={logMealEaten} style={{ flex: 1 }}>
                <input type="hidden" name="title" value={meal.title} />
                <input type="hidden" name="mealType" value={displayType} />
                <input type="hidden" name="ingredients" value={JSON.stringify(meal.ingredients)} />
                <input type="hidden" name="calories" value={meal.calories} />
                <input type="hidden" name="protein" value={meal.protein} />
                <input type="hidden" name="fat" value={meal.fat} />
                <input type="hidden" name="carbs" value={meal.carbs} />
                <button className="btn block" type="submit">Съел(а)</button>
              </form>
              <Link href="/more" className="btn ghost" style={{ flex: 1, textAlign: "center" }}>Другое &#8943;</Link>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, marginBottom: 6 }}>Все приёмы на сегодня отмечены ✓</h3>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}>Загляните завтра — новый план появится с утра.</p>
        </div>
      )}

      <div className="card" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
          <div className="eyebrow">Напоминание придёт сегодня в 20:00</div>
          <h3 style={{ fontSize: 17, marginTop: 6 }}>Ваше питание на завтра готово</h3>
        </div>
        <Link href="/reminders" className="btn ghost" style={{ whiteSpace: "nowrap" }}>Смотреть</Link>
      </div>

      {meal && (
        <form action={addToCart} style={{ display: "none" }} id="order-form">
          <input type="hidden" name="ingredients" value={JSON.stringify(meal.ingredients)} />
        </form>
      )}
    </div>
  );
}
