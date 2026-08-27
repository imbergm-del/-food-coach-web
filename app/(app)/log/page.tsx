import { createClient } from "@/lib/supabaseServer";
import { FoodThumb } from "@/components/FoodThumb";
import { LoadingLink } from "@/components/LoadingLink";
import { LogTextForm } from "./LogTextForm";
import { MEAL_TYPE_LABELS, currentMealType, getMealSchedule } from "@/lib/mealTypes";
import { todayISOInTz } from "@/lib/userTime";

export default async function LogPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, breakfast_time, lunch_time, snack_time, dinner_time")
    .eq("id", user!.id).single();

  const today = todayISOInTz(profile?.timezone);
  const mealType = currentMealType(profile?.timezone, getMealSchedule(profile));

  const { data: loggedMeals } = await supabase
    .from("meals").select("*").eq("user_id", user!.id).eq("date", today)
    .in("status", ["eaten", "photo_logged"]).order("id");

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Записать еду</div>
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>Что вы съели?</h1>

      <LogTextForm mealType={mealType} />

      <LoadingLink href="/photo" className="btn ghost block" style={{ textAlign: "center", marginBottom: 16 }}>
        Сфотографировать
      </LoadingLink>

      <div className="eyebrow" style={{ marginBottom: 8 }}>Сегодня записано</div>
      <div className="card">
        {loggedMeals?.length ? (
          loggedMeals.map(m => (
            <div key={m.id} className="listrow">
              <span style={{ display: "flex", alignItems: "center" }}>
                <FoodThumb
                  color={m.status === "photo_logged" ? "var(--fat)" : "var(--protein)"}
                  bg={m.status === "photo_logged" ? "var(--fat-bg)" : "var(--protein-bg)"}
                  size={36}
                />
                <span style={{ marginLeft: 10 }}>
                  {MEAL_TYPE_LABELS[m.meal_type as keyof typeof MEAL_TYPE_LABELS] ?? m.meal_type} — {m.title ?? "без названия"}
                </span>
              </span>
              <span className="macrolabel">{m.protein ?? 0} г белка</span>
            </div>
          ))
        ) : (
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>Сегодня пока ничего не записано.</p>
        )}
      </div>
    </div>
  );
}
