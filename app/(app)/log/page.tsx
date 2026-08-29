import { createClient } from "@/lib/supabaseServer";
import { FoodThumb } from "@/components/FoodThumb";
import { LoadingLink } from "@/components/LoadingLink";
import { LogTextForm } from "./LogTextForm";
import { mealTypeLabel, currentMealType, getMealSchedule } from "@/lib/mealTypes";
import { todayISOInTz } from "@/lib/userTime";
import { getLang } from "@/lib/language";

export default async function LogPage() {
  const lang = getLang();
  const en = lang === "en";
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
      <div className="eyebrow" style={{ marginBottom: 6 }}>{en ? "Log food" : "Записать еду"}</div>
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>{en ? "What did you eat?" : "Что вы съели?"}</h1>

      <LogTextForm mealType={mealType} mealDate={today} lang={lang} />

      <LoadingLink href="/photo" className="btn ghost block" style={{ textAlign: "center", marginBottom: 16 }}>
        {en ? "Take a photo" : "Сфотографировать"}
      </LoadingLink>

      <div className="eyebrow" style={{ marginBottom: 8 }}>{en ? "Logged today" : "Сегодня записано"}</div>
      <div className="card">
        {loggedMeals?.length ? (
          loggedMeals.map(m => (
            <div key={m.id} className="listrow">
              <span style={{ display: "flex", alignItems: "center" }}>
                <FoodThumb
                  color={m.status === "photo_logged" ? "var(--fat)" : "var(--protein)"}
                  bg={m.status === "photo_logged" ? "var(--fat-bg)" : "var(--protein-bg)"}
                  icon={m.icon}
                  size={36}
                />
                <span style={{ marginLeft: 10 }}>
                  {mealTypeLabel(m.meal_type as Parameters<typeof mealTypeLabel>[0], lang)} — {m.title ?? (en ? "untitled" : "без названия")}
                </span>
              </span>
              <span className="macrolabel">{m.protein ?? 0} {en ? "g protein" : "г белка"}</span>
            </div>
          ))
        ) : (
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>{en ? "Nothing logged yet today." : "Сегодня пока ничего не записано."}</p>
        )}
      </div>
    </div>
  );
}
