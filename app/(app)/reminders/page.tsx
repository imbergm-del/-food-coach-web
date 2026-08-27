import { createClient } from "@/lib/supabaseServer";
import { LoadingLink } from "@/components/LoadingLink";
import { SubmitButton } from "@/components/SubmitButton";
import { RecipeDisclosure } from "../today/RecipeDisclosure";
import { reshuffleTomorrowPlan } from "./actions";
import { MEAL_TYPE_LABELS, MEAL_SEQUENCE } from "@/lib/mealTypes";
import { todayISOInTz, addDaysISO } from "@/lib/userTime";
import { fillMissingPlan, PLAN_HORIZON_DAYS } from "@/lib/planGeneration";

const MAIN_MEALS = MEAL_SEQUENCE.filter(t => t !== "snack");

export default async function RemindersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("reminder_settings").select("send_at").eq("user_id", user!.id).single();
  const { data: profile } = await supabase
    .from("profiles").select("timezone, cal_target").eq("id", user!.id).single();

  const todayISO = todayISOInTz(profile?.timezone);
  // Тихо подстраховываемся: если план на завтра ещё ни разу не составляли,
  // здесь всё равно должны быть настоящие блюда, а не пустой экран.
  await fillMissingPlan(supabase, user!.id, profile?.cal_target ?? 2200, todayISO, PLAN_HORIZON_DAYS);

  const tomorrowISO = addDaysISO(todayISO, 1);

  const { data: plannedMealsRaw } = await supabase
    .from("meals").select("*").eq("user_id", user!.id).eq("date", tomorrowISO);
  const plannedMeals = MAIN_MEALS
    .map(type => plannedMealsRaw?.find(m => m.meal_type === type))
    .filter((m): m is NonNullable<typeof m> => !!m);

  const sendAt = settings?.send_at?.slice(0, 5) ?? "20:00";

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Придёт сегодня в {sendAt}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <h1 style={{ fontSize: 24 }}>Ваше питание на завтра</h1>
        <LoadingLink href="/settings" className="btn ghost" style={{ padding: "8px 10px", borderRadius: "50%" }} ariaLabel="Настройки">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.5-2-3.4-2.3.7a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.3a7.6 7.6 0 0 0-2.6 1.5l-2.3-.7-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.7a7.6 7.6 0 0 0 2.6 1.5l.4 2.3h4l.4-2.3a7.6 7.6 0 0 0 2.6-1.5l2.3.7 2-3.4-1.9-1.5Z" /></svg>
        </LoadingLink>
      </div>

      {plannedMeals.length === 0 ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
            На завтра пока ничего не запланировано.
          </p>
        </div>
      ) : (
        plannedMeals.map(m => {
          const ingredients = (m.ingredients ?? []) as { name: string; qty: string }[];
          const steps = (m.steps ?? []) as string[];
          return (
            <div key={m.id} className="card" style={{ marginBottom: 14 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                {MEAL_TYPE_LABELS[m.meal_type as keyof typeof MEAL_TYPE_LABELS] ?? m.meal_type}
              </div>
              <h3 style={{ fontSize: 17, marginBottom: 10 }}>{m.title ?? "без названия"}</h3>
              {(m.calories || m.protein || m.fat || m.carbs) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {[
                    [`${m.calories ?? 0} ккал`, "var(--ink-soft)", "var(--paper2)"],
                    [`Б ${m.protein ?? 0}`, "var(--protein)", "var(--protein-bg)"],
                    [`Ж ${m.fat ?? 0}`, "var(--fat-ink)", "var(--fat-bg)"],
                    [`У ${m.carbs ?? 0}`, "var(--carbs)", "var(--carbs-bg)"]
                  ].map(([text, color, bg]) => (
                    <span key={text} style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 600, color, background: bg, padding: "5px 10px", borderRadius: 999 }}>
                      {text}
                    </span>
                  ))}
                </div>
              )}
              <RecipeDisclosure ingredients={ingredients} steps={steps} />
            </div>
          );
        })
      )}

      <form action={reshuffleTomorrowPlan}>
        <SubmitButton className="btn ghost block" pendingText="Подбираем…">Изменить план на завтра</SubmitButton>
      </form>
    </div>
  );
}
