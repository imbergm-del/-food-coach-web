import { CoachChat } from "./CoachChat";

export default function CoachPage() {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>ИИ-коуч</div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Чем помочь?</h1>
      <CoachChat />
    </div>
  );
}
