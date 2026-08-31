import { getLang } from "@/lib/language";
import { privacy as dict, t } from "@/lib/i18n";

export const metadata = { title: "Политика конфиденциальности — AI Food Coach" };

export default function PrivacyPage() {
  const lang = getLang();
  const tr = (key: string) => t(dict, lang, key);

  return (
    <div className="shell">
      <div className="screen">
        <div className="eyebrow" style={{ marginBottom: 6 }}>AI Food Coach</div>
        <h1 style={{ fontSize: 24, marginBottom: 20 }}>{tr("title")}</h1>

        <div className="card" style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 10px" }}>{tr("p1")}</p>
          <p style={{ margin: "0 0 10px" }}>{tr("p2")}</p>
          <p style={{ margin: "0 0 10px" }}>{tr("p3")}</p>
          <p style={{ margin: 0 }}>
            {tr("p4a")}{" "}
            <a href="mailto:imbergm@gmail.com">imbergm@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
