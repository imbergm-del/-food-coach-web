"use client";

import { useState, useTransition } from "react";
import { savePlanForTomorrow } from "./actions";
import { DINNER_PROTEINS, DINNER_FATS, type DinnerProtein, type DinnerFat } from "@/lib/mealTypes";

export function PlanTomorrowForm({ initiallyOpen }: { initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [protein, setProtein] = useState<DinnerProtein>("chicken");
  const [fat, setFat] = useState<DinnerFat>("olive_oil");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button className="btn ghost block" style={{ marginBottom: 16 }} onClick={() => setOpen(true)}>
        Изменить план на завтра
      </button>
    );
  }

  return (
    <form
      action={formData => startTransition(async () => { await savePlanForTomorrow(formData); setOpen(false); })}
      className="card"
      style={{ marginBottom: 16 }}
    >
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 16px" }}>
        Совет тренера: подготовьте завтрак заранее, решите, где закажете обед, и на ужин — белок + овощи + полезный жир.
      </p>

      <div className="field">
        <label>Завтрак — что подготовите с вечера</label>
        <input name="breakfastNote" type="text" placeholder="Например: сварить овсянку с вечера" />
      </div>

      <div className="field">
        <label>Обед — где закажете</label>
        <input name="lunchNote" type="text" placeholder="Например: закажу в Sweetgreen" />
      </div>

      <div className="field">
        <label>Ужин — белок</label>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {(Object.keys(DINNER_PROTEINS) as DinnerProtein[]).map(key => (
            <button
              key={key} type="button"
              className={`tab ${protein === key ? "active" : ""}`}
              onClick={() => setProtein(key)}
            >
              {DINNER_PROTEINS[key].label}
            </button>
          ))}
        </div>
        <input type="hidden" name="dinnerProtein" value={protein} />
      </div>

      <div className="field">
        <label>Ужин — жир</label>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {(Object.keys(DINNER_FATS) as DinnerFat[]).map(key => (
            <button
              key={key} type="button"
              className={`tab ${fat === key ? "active" : ""}`}
              onClick={() => setFat(key)}
            >
              {key === "avocado" ? "Авокадо" : "Оливковое масло"}
            </button>
          ))}
        </div>
        <input type="hidden" name="dinnerFat" value={fat} />
      </div>

      <button className="btn block" type="submit" disabled={isPending}>
        {isPending ? "Сохраняем…" : "Сохранить план на завтра"}
      </button>
    </form>
  );
}
