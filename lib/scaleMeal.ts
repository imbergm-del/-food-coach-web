import type { MealDef } from "@/lib/mealMenu";
import { MEAL_CALORIE_SHARE, type MealType } from "@/lib/mealTypes";

// Только простые граммовки вида "60 г" / "200 мл" — без затрагивания
// штучных ингредиентов вроде "1 шт (120 г)", которые дробить бессмысленно.
const SIMPLE_QTY = /^(\d+(?:[.,]\d+)?)\s*(г|мл)$/;

function scaleQty(qty: string, factor: number): string {
  const match = qty.match(SIMPLE_QTY);
  if (!match) return qty;
  const amount = parseFloat(match[1].replace(",", "."));
  const scaled = Math.max(5, Math.round((amount * factor) / 5) * 5);
  return `${scaled} ${match[2]}`;
}

// Подгоняет калории/БЖУ и простые граммовки рецепта под личную суточную норму
// пользователя (по доле калорий на приём), вместо одинаковых цифр для всех.
export function scaleMealToTarget(def: MealDef, mealType: MealType, calTarget: number): MealDef {
  const targetCalories = Math.round(calTarget * MEAL_CALORIE_SHARE[mealType]);
  const factor = def.calories > 0 ? targetCalories / def.calories : 1;
  return {
    ...def,
    calories: targetCalories,
    protein: Math.round(def.protein * factor),
    fat: Math.round(def.fat * factor),
    carbs: Math.round(def.carbs * factor),
    ingredients: def.ingredients.map(i => ({ ...i, qty: scaleQty(i.qty, factor) }))
  };
}
