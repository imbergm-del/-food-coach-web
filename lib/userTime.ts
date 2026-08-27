const DEFAULT_TZ = "America/New_York";

function partsInTz(tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value ?? "0");
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

// «Сейчас» в часовом поясе пользователя. Используем только локальные геттеры
// (getHours/getDate/…) — не getTime()/toISOString(), те всё равно интерпретируют
// момент через часовой пояс среды выполнения и всё сломают.
export function nowInTz(tz?: string | null): Date {
  const p = partsInTz(tz || DEFAULT_TZ);
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

export function todayISOInTz(tz?: string | null): string {
  const p = partsInTz(tz || DEFAULT_TZ);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
