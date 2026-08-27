import { PhotoCapture } from "./PhotoCapture";
import { BackButton } from "@/components/BackButton";

export default function PhotoPage() {
  return (
    <div className="sheet">
      <BackButton style={{ marginBottom: 16, display: "inline-block" }} />
      <div className="eyebrow" style={{ marginBottom: 6 }}>Распознавание фото</div>
      <h1 style={{ fontSize: 22, marginBottom: 16, color: "var(--sheet-text)" }}>Сфотографируйте еду</h1>
      <PhotoCapture />
    </div>
  );
}
