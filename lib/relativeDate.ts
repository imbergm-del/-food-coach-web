export function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);
  const time = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  if (diffDays === 0) return `сегодня в ${time}`;
  if (diffDays === 1) return `вчера в ${time}`;
  if (diffDays > 1 && diffDays < 7) return `${diffDays} дн. назад`;
  return date.toLocaleDateString("ru-RU");
}
