import { nowInTz, todayISOInTz, addDaysISO } from "@/lib/userTime";

export const MEAL_SEQUENCE = ["breakfast", "lunch", "snack", "dinner"] as const;
export type MealType = (typeof MEAL_SEQUENCE)[number];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Завтрак", lunch: "Обед", snack: "Перекус", dinner: "Ужин"
};

export const MEAL_TYPE_LABELS_EN: Record<MealType, string> = {
  breakfast: "Breakfast", lunch: "Lunch", snack: "Snack", dinner: "Dinner"
};

export function mealTypeLabel(type: MealType, lang: "ru" | "en" = "ru"): string {
  return lang === "en" ? MEAL_TYPE_LABELS_EN[type] : MEAL_TYPE_LABELS[type];
}

// Доля суточной нормы калорий на каждый приём — используется, чтобы подгонять
// рецепты под личную норму пользователя, а не показывать фиксированные цифры всем.
export const MEAL_CALORIE_SHARE: Record<MealType, number> = {
  breakfast: 0.25, lunch: 0.35, snack: 0.15, dinner: 0.25
};

export type MealTime = { hour: number; minute: number };
export type MealSchedule = Record<MealType, MealTime>;

// Время приёмов по умолчанию — пока пользователь не задал своё расписание
// в настройках (profiles.breakfast_time / lunch_time / snack_time / dinner_time).
export const MEAL_TIME_DEFAULTS: MealSchedule = {
  breakfast: { hour: 8, minute: 0 },
  lunch: { hour: 13, minute: 0 },
  snack: { hour: 16, minute: 30 },
  dinner: { hour: 19, minute: 30 }
};

function parseTime(value: string | null | undefined, fallback: MealTime): MealTime {
  if (!value) return fallback;
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return fallback;
  return { hour: h, minute: m };
}

// Собирает личное расписание приёмов из профиля, подставляя дефолт для пустых полей.
export function getMealSchedule(profile?: {
  breakfast_time?: string | null; lunch_time?: string | null;
  snack_time?: string | null; dinner_time?: string | null;
} | null): MealSchedule {
  return {
    breakfast: parseTime(profile?.breakfast_time, MEAL_TIME_DEFAULTS.breakfast),
    lunch: parseTime(profile?.lunch_time, MEAL_TIME_DEFAULTS.lunch),
    snack: parseTime(profile?.snack_time, MEAL_TIME_DEFAULTS.snack),
    dinner: parseTime(profile?.dinner_time, MEAL_TIME_DEFAULTS.dinner)
  };
}

const toMinutes = (t: MealTime) => t.hour * 60 + t.minute;

// Приём остаётся «текущим» недолго после своего времени (полчаса — как и SMS-
// напоминание, которое приходит за столько же ДО еды), а не до времени следующего
// приёма: иначе, скажем, перекус в 16:30 продолжал бы висеть на экране до ужина в 19:00.
const CUTOVER_GRACE_MINUTES = 30;

// Какой приём сейчас «текущий» по личному расписанию — первый в порядке дня,
// чьё время (плюс грейс-период) ещё не прошло. Пропущенный приём не блокирует
// переход дальше: как только его окно закрылось, экран сам подскажет следующий.
export function currentMealType(timezone?: string | null, schedule: MealSchedule = MEAL_TIME_DEFAULTS): MealType {
  const now = nowInTz(timezone);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const type of MEAL_SEQUENCE) {
    if (nowMinutes < toMinutes(schedule[type]) + CUTOVER_GRACE_MINUTES) return type;
  }
  return "breakfast"; // все приёмы на сегодня позади — переходим к завтраку на завтра
}

// Дата, на которую подбирается «следующий приём»: обычно сегодня, но как только
// закрылось окно ужина (см. выше) — уже завтра. По часовому поясу пользователя.
export function currentMealDate(timezone?: string | null, schedule: MealSchedule = MEAL_TIME_DEFAULTS): string {
  const today = todayISOInTz(timezone);
  const now = nowInTz(timezone);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= toMinutes(schedule.dinner) + CUTOVER_GRACE_MINUTES ? addDaysISO(today, 1) : today;
}
