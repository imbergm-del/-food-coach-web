import { createClient } from "@/lib/supabaseServer";
import { BackButton } from "@/components/BackButton";
import { getDisplayMealType } from "@/lib/getDisplayMealType";
import { MEAL_TYPE_LABELS } from "@/lib/mealTypes";
import { MoreMenu } from "./MoreMenu";

export default async function MorePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user!.id).single();
  const { type: displayType } = await getDisplayMealType(supabase, user!.id, profile?.timezone);
  const mealLabel = displayType ? MEAL_TYPE_LABELS[displayType] : null;
  const forMeal = mealLabel ? ` · ${mealLabel.toLowerCase()}` : "";

  const items = [
    { title: "Заменить блюдо", desc: `Похожие варианты по КБЖУ${forMeal}`, href: "/change", color: "var(--protein)", bg: "var(--protein-bg)" },
    { title: "Сфотографировать еду", desc: "Распознать по фото", href: "/photo", color: "var(--fat)", bg: "var(--fat-bg)" },
    { title: "Я голоден сейчас", desc: "Срочные варианты прямо сейчас", href: "/hungry", color: "var(--warn)", bg: "var(--protein-bg)" },
    { title: "Ем вне дома", desc: `Подбор блюда в ресторане${forMeal}`, href: "/restaurant", color: "var(--water)", bg: "var(--water-bg)" }
  ];

  return (
    <div>
      <BackButton className="btn ghost" style={{ marginBottom: 16, display: "inline-block" }} />
      <div className="eyebrow" style={{ marginBottom: 6 }}>Ещё варианты</div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Что хотите сделать?</h1>
      <MoreMenu items={items} />
    </div>
  );
}
