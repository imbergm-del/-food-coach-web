import Link from "next/link";
import { PhotoCapture } from "./PhotoCapture";

export default function PhotoPage() {
  return (
    <div className="sheet">
      <Link href="/today" className="btn ghost on-sheet" style={{ marginBottom: 16, display: "inline-block" }}>&larr; Назад</Link>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Распознавание фото</div>
      <h1 style={{ fontSize: 22, marginBottom: 16, color: "var(--sheet-text)" }}>Сфотографируйте еду</h1>
      <PhotoCapture />
    </div>
  );
}
