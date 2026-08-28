import { createClient } from "@/lib/supabaseServer";
import { FoodThumb } from "@/components/FoodThumb";
import { MEAL_TYPE_LABELS } from "@/lib/mealTypes";
import { generateWeekPlan, addWeekIngredientsToCart } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { todayISOInTz, addDaysISO } from "@/lib/userTime";
import { PLAN_HORIZON_DAYS } from "@/lib/planGeneration";

const WEEKDAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export default async function PlanPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user!.id).single();
  const tz = profile?.timezone;

  const todayISO = todayISOInTz(tz);
  const lastISO = addDaysISO(todayISO, PLAN_HORIZON_DAYS - 1);

  const { data: meals } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", user!.id)
    .gte("date", todayISO)
    .lte("date", lastISO)
    .order("id");

  const days = Array.from({ length: PLAN_HORIZON_DAYS }, (_, i) => {
    const iso = addDaysISO(todayISO, i);
    const weekday = new Date(`${iso}T00:00:00`).getDay();
    return {
      iso,
      label: WEEKDAY_LABELS[weekday],
      dayOfMonth: Number(iso.slice(8, 10)),
      isToday: i === 0,
      meals: meals?.filter(m => m.date === iso) ?? []
    };
  });

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>План на 5 дней</div>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Питание на ближайшие дни</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <form action={generateWeekPlan} style={{ flex: 1 }}>
          <SubmitButton pendingText="Составляем…">Составить план</SubmitButton>
        </form>
        <form action={addWeekIngredientsToCart} style={{ flex: 1 }}>
          <SubmitButton className="btn ghost block" pendingText="Добавляем…">Продукты в корзину</SubmitButton>
        </form>
      </div>

      {days.map(day => (
        <div key={day.iso} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <span className="eyebrow" style={{ color: day.isToday ? "var(--ink)" : "var(--ink-soft)" }}>
              {day.label} · {day.dayOfMonth}{day.isToday ? " · сегодня" : ""}
            </span>
          </div>
          <div className="card">
            {day.meals.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                Пока пусто — записывайте приёмы пищи на «Сегодня» или через «Записать еду».
              </p>
            ) : (
              day.meals.map(m => {
                const ingredients = (m.ingredients ?? []) as { name: string; qty: string }[];
                return (
                  <div key={m.id} className="listrow" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <FoodThumb
                          color={m.status === "eaten" || m.status === "photo_logged" ? "var(--protein)" : "var(--carbs)"}
                          bg={m.status === "eaten" || m.status === "photo_logged" ? "var(--protein-bg)" : "var(--carbs-bg)"}
                          icon={m.icon}
                          size={36}
                        />
                        <span>
                          {MEAL_TYPE_LABELS[m.meal_type as keyof typeof MEAL_TYPE_LABELS] ?? m.meal_type} — {m.title ?? "без названия"}
                        </span>
                      </span>
                      <span className="macrolabel">{m.calories ?? 0} ккал</span>
                    </span>
                    {!!ingredients.length && (
                      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-soft)", paddingLeft: 46 }}>
                        {ingredients.map(i => `${i.name} ${i.qty}`).join(" · ")}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
