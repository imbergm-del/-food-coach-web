import { nowInTz, todayISOInTz, addDaysISO } from "@/lib/userTime";

export const MEAL_SEQUENCE = ["breakfast", "lunch", "snack", "dinner"] as const;
export type MealType = (typeof MEAL_SEQUENCE)[number];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Завтрак", lunch: "Обед", snack: "Перекус", dinner: "Ужин"
};

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

// Какой приём сейчас «текущий» по личному расписанию: держится до времени
// следующего приёма, так что пропущенный приём не блокирует переход дальше.
export function currentMealType(timezone?: string | null, schedule: MealSchedule = MEAL_TIME_DEFAULTS): MealType {
  const now = nowInTz(timezone);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const lunch = toMinutes(schedule.lunch), snack = toMinutes(schedule.snack), dinner = toMinutes(schedule.dinner);
  if (nowMinutes < lunch) return "breakfast";
  if (nowMinutes < snack) return "lunch";
  if (nowMinutes < dinner) return "snack";
  if (nowMinutes < dinner + 60) return "dinner";
  return "breakfast"; // через час после ужина — переходим к завтраку на завтра
}

// Дата, на которую подбирается «следующий приём»: обычно сегодня, но через час
// после ужина по расписанию — уже завтра. Всё по часовому поясу пользователя.
export function currentMealDate(timezone?: string | null, schedule: MealSchedule = MEAL_TIME_DEFAULTS): string {
  const today = todayISOInTz(timezone);
  const now = nowInTz(timezone);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= toMinutes(schedule.dinner) + 60 ? addDaysISO(today, 1) : today;
}
