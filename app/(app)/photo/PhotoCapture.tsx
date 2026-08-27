"use client";

import { useRef, useState } from "react";
import { logPhotoMeal } from "./actions";
import { resizeToJpegBase64 } from "@/lib/imageResize";
import { SubmitButton } from "@/components/SubmitButton";
import { LoadingLink } from "@/components/LoadingLink";

type Result = {
  title: string;
  ingredients: { name: string; qty: string }[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export function PhotoCapture({ mealType, mealDate }: { mealType: string; mealDate: string }) {
  const [status, setStatus] = useState<"idle" | "analyzing" | "result" | "error">("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
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
        setError(data.error ?? "Не получилось распознать фото.");
        setStatus("error");
      } else {
        setResult(data);
        setStatus("result");
      }
    } catch {
      setError("Не получилось обработать фото. Попробуйте ещё раз.");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setPreview(null);
    setResult(null);
    setError("");
  }

  if (status === "idle") {
    return (
      <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 12 }}>
        <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: "0 0 4px" }}>
          Сфотографируйте тарелку — оценим блюдо и посчитаем КБЖУ.
        </p>
        <button className="btn block" onClick={() => cameraInputRef.current?.click()}>Сделать фото</button>
        <button className="btn ghost block" onClick={() => galleryInputRef.current?.click()}>Выбрать из галереи</button>
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
        <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: 0, textAlign: "center" }}>Распознаём блюдо…</p>
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
          <button className="btn block" onClick={reset}>Попробовать снова</button>
          <LoadingLink href="/today" className="btn ghost" style={{ flex: 1, textAlign: "center" }}>Отмена</LoadingLink>
        </div>
      </div>
    );
  }

  if (status === "result" && result) {
    return (
      <div>
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
          {preview && <img src={preview} alt="" style={{ width: "100%", borderRadius: 12, marginBottom: 14 }} />}
          <h3 style={{ fontSize: 17, marginBottom: 10 }}>{result.title}</h3>
          {result.ingredients.map((d, i) => (
            <div key={i} className="listrow">
              <span>{d.name}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-soft)" }}>{d.qty}</span>
            </div>
          ))}
          <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-soft)", margin: "12px 0 0" }}>
            Оценочно: {result.calories} ккал · Б {result.protein} · Ж {result.fat} · У {result.carbs}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <form action={logPhotoMeal} style={{ flex: 1 }}>
            <input type="hidden" name="mealType" value={mealType} />
            <input type="hidden" name="date" value={mealDate} />
            <input type="hidden" name="title" value={result.title} />
            <input type="hidden" name="ingredients" value={JSON.stringify(result.ingredients)} />
            <input type="hidden" name="calories" value={result.calories} />
            <input type="hidden" name="protein" value={result.protein} />
            <input type="hidden" name="fat" value={result.fat} />
            <input type="hidden" name="carbs" value={result.carbs} />
            <SubmitButton>Подтвердить</SubmitButton>
          </form>
          <button className="btn ghost" style={{ flex: 1 }} onClick={reset}>Переснять</button>
        </div>
      </div>
    );
  }

  return null;
}
