import { createClient } from "@/lib/supabaseServer";
import { FoodThumb } from "@/components/FoodThumb";
import { MEAL_TYPE_LABELS } from "@/lib/mealTypes";
import { generateWeekPlan, addWeekIngredientsToCart } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { nowInTz, todayISOInTz } from "@/lib/userTime";

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // 0 = Monday
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function PlanPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user!.id).single();
  const tz = profile?.timezone;

  const monday = startOfWeek(nowInTz(tz));
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const todayISO = todayISOInTz(tz);

  const { data: meals } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", user!.id)
    .gte("date", toISODate(monday))
    .lte("date", toISODate(sunday))
    .order("id");

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const iso = toISODate(d);
    return {
      iso,
      label: WEEKDAY_LABELS[i],
      dayOfMonth: d.getDate(),
      isToday: iso === todayISO,
      meals: meals?.filter(m => m.date === iso) ?? []
    };
  });

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Недельный план</div>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Питание на неделю</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <form action={generateWeekPlan} style={{ flex: 1 }}>
          <input type="hidden" name="weekEnd" value={toISODate(sunday)} />
          <SubmitButton pendingText="Составляем…">Составить план на неделю</SubmitButton>
        </form>
        <form action={addWeekIngredientsToCart} style={{ flex: 1 }}>
          <input type="hidden" name="weekStart" value={toISODate(monday)} />
          <input type="hidden" name="weekEnd" value={toISODate(sunday)} />
          <SubmitButton className="btn ghost block" pendingText="Добавляем…">Продукты недели в корзину</SubmitButton>
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
