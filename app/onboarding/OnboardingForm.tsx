"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { onboarding as dict, t, type Lang } from "@/lib/i18n";

export function OnboardingForm({ lang }: { lang: Lang }) {
  const tr = (key: string) => t(dict, lang, key);
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "">("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [workouts, setWorkouts] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ageN = parseFloat(age), weightN = parseFloat(weight), heightN = parseFloat(height), workoutsN = parseFloat(workouts);

    const valid =
      name.trim().length > 0 &&
      (sex === "male" || sex === "female") &&
      ageN >= 10 && ageN <= 100 &&
      weightN >= 30 && weightN <= 250 &&
      heightN >= 100 && heightN <= 230 &&
      workoutsN >= 0 && workoutsN <= 14;

    if (!valid) {
      setError(tr("invalid"));
      return;
    }
    setError("");
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Белок и калории растут с частотой тренировок (ISSN: 1.6–2.2 г/кг при регулярных
    // тренировках вместо базовых 1.2–1.3 г/кг), а калории дополнительно немного снижаются
    // с возрастом — вместо единой формулы "вес × константа" без учёта образа жизни.
    const tier =
      workoutsN >= 6 ? { proteinPerKg: 2.0, calPerKg: 28 } :
      workoutsN >= 4 ? { proteinPerKg: 1.8, calPerKg: 26 } :
      workoutsN >= 2 ? { proteinPerKg: 1.6, calPerKg: 24 } :
      { proteinPerKg: 1.3, calPerKg: 22 };
    const ageFactor = ageN > 30 ? Math.max(0.85, 1 - (ageN - 30) * 0.005) : 1;
    // При том же весе у женщин в среднем ниже безжировая масса, поэтому и калорийность
    // немного ниже; жир, наоборот, не опускаем — на нём держится выработка гормонов
    // (месячный цикл в том числе), поэтому для женщин минимум г/кг жира чуть выше.
    const calSexFactor = sex === "female" ? 0.92 : 1;
    const fatPerKg = sex === "female" ? 0.85 : 0.75;

    const proteinTarget = Math.round(weightN * tier.proteinPerKg);
    const fatTarget = Math.round(weightN * fatPerKg);
    const calTarget = Math.round(weightN * tier.calPerKg * ageFactor * calSexFactor);
    const carbTarget = Math.max(0, Math.round((calTarget - (proteinTarget * 4 + fatTarget * 9)) / 4));

    await supabase.from("profiles").update({
      name: name.trim(), sex, age: ageN, weight_kg: weightN, height_cm: heightN, workouts_per_week: workoutsN,
      protein_target: proteinTarget, fat_target: fatTarget, carb_target: carbTarget, cal_target: calTarget
    }).eq("id", user.id);

    setSaving(false);
    router.push("/today");
  }

  return (
    <div className="shell">
      <div className="screen">
        <div style={{ width: 56, height: 56, borderRadius: 18, background: "var(--carbs-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--carbs)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>{tr("step")}</div>
        <h1 style={{ fontSize: 24, marginBottom: 6 }}>{tr("title")}</h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 22px" }}>{tr("subtitle")}</p>
        <form onSubmit={handleSubmit}>
          <div className="field"><label>{tr("name")}</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={tr("namePlaceholder")} /></div>
          <div className="field">
            <label>{tr("sex")}</label>
            <div style={{ display: "flex", gap: 8 }}>
              {([["male", tr("male")], ["female", tr("female")]] as const).map(([value, label]) => (
                <button
                  key={value} type="button" onClick={() => setSex(value)}
                  className={`tab ${sex === value ? "active" : ""}`} style={{ flex: 1 }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="field"><label>{tr("age")}</label><input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder={tr("agePlaceholder")} /></div>
          <div className="field"><label>{tr("weight")}</label><input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder={tr("weightPlaceholder")} /></div>
          <div className="field"><label>{tr("height")}</label><input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder={tr("heightPlaceholder")} /></div>
          <div className="field"><label>{tr("workouts")}</label><input type="number" value={workouts} onChange={e => setWorkouts(e.target.value)} placeholder={tr("workoutsPlaceholder")} /></div>
          {error && <p style={{ color: "var(--warn)", fontSize: 12, marginTop: -10, marginBottom: 14 }}>{error}</p>}
          <button className="btn block" type="submit" disabled={saving}>{saving ? tr("saving") : tr("submit")}</button>
        </form>
      </div>
    </div>
  );
}
