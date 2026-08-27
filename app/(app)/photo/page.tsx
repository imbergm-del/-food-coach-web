import { createClient } from "@/lib/supabaseServer";
import { BackButton } from "@/components/BackButton";
import { getDisplayMealType } from "@/lib/getDisplayMealType";
import { getMealSchedule, MEAL_TYPE_LABELS } from "@/lib/mealTypes";
import { PhotoCapture } from "./PhotoCapture";

export default async function PhotoPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, breakfast_time, lunch_time, snack_time, dinner_time")
    .eq("id", user!.id).single();

  const schedule = getMealSchedule(profile);
  const { type: mealType, date: mealDate } = await getDisplayMealType(supabase, user!.id, profile?.timezone, schedule);
  const mealLabel = mealType ? MEAL_TYPE_LABELS[mealType] : null;

  return (
    <div>
      <BackButton className="btn ghost" style={{ marginBottom: 16, display: "inline-block" }} />
      <div className="eyebrow" style={{ marginBottom: 6 }}>Распознавание фото{mealLabel ? ` · ${mealLabel}` : ""}</div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Сфотографируйте еду</h1>
      {mealType ? (
        <PhotoCapture mealType={mealType} mealDate={mealDate} />
      ) : (
        <div className="card">
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>Все приёмы на сегодня уже отмечены.</p>
        </div>
      )}
    </div>
  );
}
