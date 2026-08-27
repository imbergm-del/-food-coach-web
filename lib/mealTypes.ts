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

export function currentMealType(timezone?: string | null): MealType {
  const hour = nowInTz(timezone).getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 19) return "snack";
  if (hour < 20) return "dinner";
  return "breakfast"; // после 20:00 — переходим к завтраку на завтра
}

// Дата, на которую подбирается «следующий приём»: обычно сегодня,
// но после 20:00 (когда ужин уже позади) — уже завтра. Всё — по часовому
// поясу пользователя (profiles.timezone), а не сервера.
export function currentMealDate(timezone?: string | null): string {
  const today = todayISOInTz(timezone);
  return nowInTz(timezone).getHours() >= 20 ? addDaysISO(today, 1) : today;
}

// Ориентировочное время каждого приёма — используется, чтобы прислать SMS
// за час до еды. Не настраивается пользователем, только вкл/выкл функции целиком.
export const MEAL_TIME_DEFAULTS: Record<MealType, { hour: number; minute: number }> = {
  breakfast: { hour: 8, minute: 0 },
  lunch: { hour: 13, minute: 0 },
  snack: { hour: 16, minute: 30 },
  dinner: { hour: 19, minute: 30 }
};

// По совету тренера: ужин = белок + овощи + полезный жир
export const DINNER_PROTEINS = {
  meat: { label: "Мясо", calories: 480, protein: 40, fat: 24, carbs: 14 },
  fish: { label: "Рыба", calories: 400, protein: 40, fat: 16, carbs: 12 },
  chicken: { label: "Курица", calories: 420, protein: 42, fat: 16, carbs: 14 }
} as const;
export type DinnerProtein = keyof typeof DINNER_PROTEINS;

export const DINNER_FATS = {
  olive_oil: "оливковым маслом",
  avocado: "авокадо"
} as const;
export type DinnerFat = keyof typeof DINNER_FATS;
