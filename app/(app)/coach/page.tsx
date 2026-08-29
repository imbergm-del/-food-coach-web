import { CoachChat } from "./CoachChat";
import { getLang } from "@/lib/language";
import { coach as dict, t } from "@/lib/i18n";

export default function CoachPage() {
  const lang = getLang();
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{t(dict, lang, "eyebrow")}</div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>{t(dict, lang, "title")}</h1>
      <CoachChat lang={lang} />
    </div>
  );
}
