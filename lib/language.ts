import { cookies } from "next/headers";

export type Lang = "ru" | "en";

// Кука — источник истины для рендера (работает и до логина, на /login), profiles.language —
// для синхронизации между устройствами (проставляется при логине и при переключении).
export function getLang(): Lang {
  return cookies().get("lang")?.value === "en" ? "en" : "ru";
}
