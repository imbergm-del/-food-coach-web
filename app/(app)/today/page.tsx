import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import { addToCart } from "./actions";
import { CookingModeTabs } from "./CookingModeTabs";
import { MacroDial } from "@/components/MacroDial";
import { FoodThumb } from "@/components/FoodThumb";

const MEALS_BY_MODE: Record<string, { title: string; desc: string; kcal: string; ingredients: { name: string; qty: string }[] }> = {
  "0": {
    title: "Быстрая тарелка без готовки",
    desc: "Готовая курица-гриль, греч. йогурт, огурцы, хлебцы",
    kcal: "480 ккал · Б 46 · Ж 14 · У 38",
    ingredients: [{ name: "Курица-гриль готовая", qty: "300 г" }, { name: "Греч. йогурт", qty: "1 шт" }, { name: "Огурцы", qty: "2 шт" }, { name: "Хлебцы", qty: "1 уп." }]
  },
  "5": {
    title: "Собрать за 5 минут",
    desc: "Тунец, авокадо, лаваш, свежие овощи",
    kcal: "510 ккал · Б 42 · Ж 18 · У 40",
    ingredients: [{ name: "Тунец консервир.", qty: "1 банка" }, { name: "Авокадо", qty: "1 шт" }, { name: "Лаваш", qty: "1 шт" }, { name: "Овощи свежие", qty: "150 г" }]
  },
  "15": {
    title: "Боул с курицей и рисом",
    desc: "200 г курицы, 150 г риса, 150 г овощей, 1 ч.л. оливкового масла",
    kcal: "520 ккал · Б 48 · Ж 12 · У 54",
    ingredients: [{ name: "Куриная грудка", qty: "200 г" }, { name: "Рис", qty: "150 г" }, { name: "Овощи замороженные", qty: "150 г" }, { name: "Оливковое масло", qty: "1 шт" }]
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
  const meal = MEALS_BY_MODE[cookingMode] ?? MEALS_BY_MODE["0"];

  const p = profile ?? { protein_target: 125, fat_target: 72, carb_target: 210, cal_target: 2200, name: "друг" };
  const usedProtein = meals?.reduce((s, m) => s + (m.status === "eaten" ? m.protein ?? 0 : 0), 0) ?? 62;
  const usedFat = meals?.reduce((s, m) => s + (m.status === "eaten" ? m.fat ?? 0 : 0), 0) ?? 31;
  const usedCarbs = meals?.reduce((s, m) => s + (m.status === "eaten" ? m.carbs ?? 0 : 0), 0) ?? 95;
  const usedCals = usedProtein * 4 + usedFat * 9 + usedCarbs * 4;
  const caloriesLeft = Math.max(0, p.cal_target - usedCals);

  return (
    <div>
      <div className="eyebrow">СЕГОДНЯ</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "6px 0 20px" }}>
        <h1 style={{ fontSize: 26 }}>С добрым утром, {p.name ?? "друг"}</h1>
        <Link href="/profile" className="btn ghost" style={{ padding: "8px 10px", borderRadius: "50%" }} aria-label="Профиль">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.5-2-3.4-2.3.7a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.3a7.6 7.6 0 0 0-2.6 1.5l-2.3-.7-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.7a7.6 7.6 0 0 0 2.6 1.5l.4 2.3h4l.4-2.3a7.6 7.6 0 0 0 2.6-1.5l2.3.7 2-3.4-1.9-1.5Z" /></svg>
        </Link>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: ".04em", padding: "4px 10px", borderRadius: 999, background: "var(--protein-bg)", color: "var(--protein)", marginBottom: 10 }}>
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

      <div className="eyebrow" style={{ marginBottom: 8 }}>Следующий приём · 12:30</div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
          <FoodThumb color="var(--protein)" bg="var(--protein-bg)" />
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>{meal.title}</h3>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>{meal.desc}</p>
          </div>
        </div>
        <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-soft)", margin: "0 0 14px" }}>{meal.kcal}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" style={{ flex: 1 }}>Съел(а)</button>
          <Link href="/more" className="btn ghost" style={{ flex: 1, textAlign: "center" }}>Другое &#8943;</Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
          <div className="eyebrow">Напоминание придёт сегодня в 20:00</div>
          <h3 style={{ fontSize: 15, marginTop: 4 }}>Ваше питание на завтра готово</h3>
        </div>
        <Link href="/reminders" className="btn ghost" style={{ whiteSpace: "nowrap" }}>Смотреть</Link>
      </div>

      <form action={addToCart} style={{ display: "none" }} id="order-form">
        <input type="hidden" name="ingredients" value={JSON.stringify(meal.ingredients)} />
      </form>
    </div>
  );
}
