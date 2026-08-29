"use client";

import { useRef, useState } from "react";
import { logPhotoMeal } from "./actions";
import { resizeToJpegBase64 } from "@/lib/imageResize";
import { SubmitButton } from "@/components/SubmitButton";
import { LoadingLink } from "@/components/LoadingLink";
import type { Lang } from "@/lib/language";

type Ingredient = { name: string; qty: string; calories: number; protein: number; fat: number; carbs: number };
type Result = { title: string; ingredients: Ingredient[] };

export function PhotoCapture({ mealType, mealDate, lang = "ru" }: { mealType: string; mealDate: string; lang?: Lang }) {
  const en = lang === "en";
  const [status, setStatus] = useState<"idle" | "analyzing" | "result" | "error">("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setStatus("analyzing");
    setError("");

    try {
      const dataUrl = await resizeToJpegBase64(file);
      setPreview(dataUrl);
      const base64 = dataUrl.split(",")[1];

      const res = await fetch("/api/photo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType: "image/jpeg" })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? (en ? "Couldn't recognize the photo." : "Не получилось распознать фото."));
        setStatus("error");
      } else {
        setResult(data);
        setStatus("result");
      }
    } catch {
      setError(en ? "Couldn't process the photo. Please try again." : "Не получилось обработать фото. Попробуйте ещё раз.");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setPreview(null);
    setResult(null);
    setRemoved(new Set());
    setError("");
  }

  function toggleRemoved(i: number) {
    setRemoved(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  if (status === "idle") {
    return (
      <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 12 }}>
        <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: "0 0 4px" }}>
          {en ? "Photograph your plate — we'll identify the dish and calculate its macros." : "Сфотографируйте тарелку — оценим блюдо и посчитаем КБЖУ."}
        </p>
        <button className="btn block" onClick={() => cameraInputRef.current?.click()}>{en ? "Take a photo" : "Сделать фото"}</button>
        <button className="btn ghost block" onClick={() => galleryInputRef.current?.click()}>{en ? "Choose from gallery" : "Выбрать из галереи"}</button>
        <input
          ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
          onChange={e => handleFile(e.target.files?.[0])}
        />
        <input
          ref={galleryInputRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </div>
    );
  }

  if (status === "analyzing") {
    return (
      <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        {preview && <img src={preview} alt="" style={{ width: "100%", borderRadius: 12, marginBottom: 14 }} />}
        <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: 0, textAlign: "center" }}>{en ? "Recognizing the dish…" : "Распознаём блюдо…"}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div>
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
          {preview && <img src={preview} alt="" style={{ width: "100%", borderRadius: 12, marginBottom: 14 }} />}
          <p style={{ color: "var(--protein)", fontSize: 14, margin: 0 }}>{error}</p>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn block" onClick={reset}>{en ? "Try again" : "Попробовать снова"}</button>
          <LoadingLink href="/today" className="btn ghost" style={{ flex: 1, textAlign: "center" }}>{en ? "Cancel" : "Отмена"}</LoadingLink>
        </div>
      </div>
    );
  }

  if (status === "result" && result) {
    const kept = result.ingredients.filter((_, i) => !removed.has(i));
    const totals = kept.reduce(
      (s, d) => ({ calories: s.calories + d.calories, protein: s.protein + d.protein, fat: s.fat + d.fat, carbs: s.carbs + d.carbs }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );
    const keptIngredients = kept.map(({ name, qty }) => ({ name, qty }));

    return (
      <div>
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
          {preview && <img src={preview} alt="" style={{ width: "100%", borderRadius: 12, marginBottom: 14 }} />}
          <h3 style={{ fontSize: 17, marginBottom: 6 }}>{result.title}</h3>
          <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "0 0 10px" }}>
            {en ? "Not what's on the plate, or didn't eat all of it — remove what doesn't belong." : "Не то на тарелке или не всё съели — уберите лишнее из списка."}
          </p>
          {result.ingredients.map((d, i) => {
            const isRemoved = removed.has(i);
            return (
              <div key={i} className="listrow" style={{ opacity: isRemoved ? 0.45 : 1 }}>
                <span style={{ textDecoration: isRemoved ? "line-through" : "none" }}>{d.name}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-soft)" }}>{d.qty}</span>
                  <button
                    type="button" onClick={() => toggleRemoved(i)} className="btn ghost"
                    style={{ padding: "3px 10px", fontSize: 11.5 }}
                  >
                    {isRemoved ? (en ? "Bring back" : "Вернуть") : (en ? "Remove" : "Убрать")}
                  </button>
                </span>
              </div>
            );
          })}
          <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-soft)", margin: "12px 0 0" }}>
            {en ? "Estimate" : "Оценочно"}: {totals.calories} {en ? "kcal" : "ккал"} · {en ? "P" : "Б"} {totals.protein} · {en ? "F" : "Ж"} {totals.fat} · {en ? "C" : "У"} {totals.carbs}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <form action={logPhotoMeal} style={{ flex: 1 }}>
            <input type="hidden" name="mealType" value={mealType} />
            <input type="hidden" name="date" value={mealDate} />
            <input type="hidden" name="title" value={result.title} />
            <input type="hidden" name="ingredients" value={JSON.stringify(keptIngredients)} />
            <input type="hidden" name="calories" value={totals.calories} />
            <input type="hidden" name="protein" value={totals.protein} />
            <input type="hidden" name="fat" value={totals.fat} />
            <input type="hidden" name="carbs" value={totals.carbs} />
            <SubmitButton disabled={!keptIngredients.length}>{en ? "Confirm" : "Подтвердить"}</SubmitButton>
          </form>
          <button className="btn ghost" style={{ flex: 1 }} onClick={reset}>{en ? "Retake" : "Переснять"}</button>
        </div>
      </div>
    );
  }

  return null;
}
