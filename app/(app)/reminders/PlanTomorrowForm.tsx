"use client";

import { useRef, useState, useTransition } from "react";
import { savePlanForTomorrow } from "./actions";
import { DINNER_PROTEINS, DINNER_FATS, type DinnerProtein, type DinnerFat } from "@/lib/mealTypes";
import { resizeToJpegBase64 } from "@/lib/imageResize";

const BREAKFAST_IDEAS = ["Овсянка с вечера", "Сварить яйца на неделю", "Йогурт с ягодами и гранолой", "Творог с мёдом"];
const LUNCH_IDEAS = ["Закажу в Sweetgreen", "Возьму с собой из дома", "Закажу в Chipotle", "Кафе рядом с офисом"];

export function PlanTomorrowForm({ initiallyOpen }: { initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [breakfastNote, setBreakfastNote] = useState("");
  const [lunchNote, setLunchNote] = useState("");
  const [protein, setProtein] = useState<DinnerProtein>("chicken");
  const [fat, setFat] = useState<DinnerFat>("olive_oil");
  const [isPending, startTransition] = useTransition();
  const [photoStatus, setPhotoStatus] = useState<"idle" | "analyzing" | "error">("idle");
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!open) {
    return (
      <button className="btn ghost block" style={{ marginBottom: 16 }} onClick={() => setOpen(true)}>
        Изменить план на завтра
      </button>
    );
  }

  async function handleFridgePhoto(file: File | undefined) {
    if (!file) return;
    setPhotoStatus("analyzing");
    setPhotoError("");
    try {
      const dataUrl = await resizeToJpegBase64(file);
      const res = await fetch("/api/plan/suggest-from-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl.split(",")[1], mediaType: "image/jpeg" })
      });
      const data = await res.json();
      if (!res.ok) {
        setPhotoError(data.error ?? "Не получилось разобрать фото.");
        setPhotoStatus("error");
        return;
      }
      setBreakfastNote(data.breakfastIdea ?? breakfastNote);
      setLunchNote(data.lunchIdea ?? lunchNote);
      if (data.dinnerProtein) setProtein(data.dinnerProtein);
      if (data.dinnerFat) setFat(data.dinnerFat);
      setPhotoStatus("idle");
    } catch {
      setPhotoError("Не получилось обработать фото. Попробуйте ещё раз.");
      setPhotoStatus("error");
    }
  }

  return (
    <form
      action={formData => startTransition(async () => { await savePlanForTomorrow(formData); setOpen(false); })}
      className="card"
      style={{ marginBottom: 16 }}
    >
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 14px" }}>
        Совет тренера: подготовьте завтрак заранее, решите, где закажете обед, и на ужин — белок + овощи + полезный жир.
      </p>

      <button
        type="button"
        className="btn ghost block"
        onClick={() => photoInputRef.current?.click()}
        disabled={photoStatus === "analyzing"}
        style={{ marginBottom: 16 }}
      >
        {photoStatus === "analyzing" ? "Смотрю, что на фото…" : "📷 Сфотографировать холодильник"}
      </button>
      <input
        ref={photoInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
        onChange={e => handleFridgePhoto(e.target.files?.[0])}
      />
      {photoStatus === "error" && (
        <p style={{ fontSize: 12.5, color: "var(--warn)", margin: "-8px 0 16px" }}>{photoError}</p>
      )}

      <div className="field">
        <label>Завтрак — что подготовите с вечера</label>
        <input
          name="breakfastNote" type="text" placeholder="Например: сварить овсянку с вечера"
          value={breakfastNote} onChange={e => setBreakfastNote(e.target.value)}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {BREAKFAST_IDEAS.map(idea => (
            <button key={idea} type="button" className="tab" onClick={() => setBreakfastNote(idea)}>{idea}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Обед — где закажете</label>
        <input
          name="lunchNote" type="text" placeholder="Например: закажу в Sweetgreen"
          value={lunchNote} onChange={e => setLunchNote(e.target.value)}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {LUNCH_IDEAS.map(idea => (
            <button key={idea} type="button" className="tab" onClick={() => setLunchNote(idea)}>{idea}</button>
          ))}
        </div>
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
