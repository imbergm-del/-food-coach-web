import type { MealType } from "@/lib/mealTypes";
import type { FoodIconKey } from "@/components/FoodIcons";
import type { Lang } from "@/lib/language";

type MealText = { title: string; desc: string; ingredients: { name: string; qty: string }[]; steps: string[] };

export type MealDef = {
  title: string; desc: string; calories: number; protein: number; fat: number; carbs: number;
  cookingMode?: "5" | "15";
  // Явно завтрачное блюдо — не подходит, если перекус подбирается поздним вечером
  // (например, догоняем незалогированный приём после того, как ужин уже съеден).
  notEvening?: boolean;
  icon?: FoodIconKey;
  photoUrl?: string; ingredients: { name: string; qty: string }[]; steps: string[];
  // Английский перевод названия/описания/состава/шагов — используется вместо русских
  // полей выше, когда у пользователя выбран английский язык (см. localizeMeal).
  en?: MealText;
};

// Подставляет английские title/desc/ingredients/steps вместо русских, если они
// заданы и выбран английский язык — калории/БЖУ/иконка не зависят от языка.
export function localizeMeal(def: MealDef, lang: Lang): MealDef {
  if (lang !== "en" || !def.en) return def;
  return { ...def, title: def.en.title, desc: def.en.desc, ingredients: def.en.ingredients, steps: def.en.steps };
}

// По 7 разных блюд на завтрак/обед/ужин — этого хватает, чтобы за неделю ни одно
// блюдо не повторилось (см. lib/mealRotation.ts). У перекуса вариантов меньше —
// в недельный план он не входит. Плюс несколько блюд с более высоким белком для
// спортсменов в каждом пуле — общая ротация их не выделяет отдельно, они просто
// увеличивают разнообразие и покрывают более высокую норму БЖУ.
export const MEAL_POOL: Record<MealType, MealDef[]> = {
  breakfast: [
    {
      title: "Овсянка на 5 минут",
      desc: "Хлопья быстрого приготовления, молоко, банан",
      calories: 380, protein: 14, fat: 8, carbs: 62, cookingMode: "5", icon: "oatmeal",
      ingredients: [{ name: "Овсяные хлопья быстрые", qty: "60 г" }, { name: "Молоко", qty: "200 мл" }, { name: "Банан", qty: "1 шт (120 г)" }],
      steps: ["Залейте 60 г хлопьев 200 мл горячего молока или воды, оставьте на 3 минуты.", "Нарежьте банан (120 г) сверху."],
      en: {
        title: "5-Minute Oatmeal", desc: "Instant oats, milk, banana",
        ingredients: [{ name: "Instant oats", qty: "60 g" }, { name: "Milk", qty: "200 ml" }, { name: "Banana", qty: "1 (120 g)" }],
        steps: ["Pour 200 ml of hot milk or water over 60 g of oats and let sit for 3 minutes.", "Slice the banana (120 g) on top."]
      }
    },
    {
      title: "Омлет с овощами",
      desc: "Яйца, шпинат, тост",
      calories: 360, protein: 24, fat: 20, carbs: 20, cookingMode: "15", icon: "egg",
      ingredients: [{ name: "Яйца", qty: "2 шт (100 г)" }, { name: "Шпинат", qty: "50 г" }, { name: "Тост цельнозерн.", qty: "1 шт (30 г)" }],
      steps: ["Взбейте 2 яйца (100 г), добавьте 50 г шпината.", "Жарьте на среднем огне 4–5 минут, помешивая.", "Подавайте с тостом (30 г)."],
      en: {
        title: "Veggie Omelet", desc: "Eggs, spinach, toast",
        ingredients: [{ name: "Eggs", qty: "2 (100 g)" }, { name: "Spinach", qty: "50 g" }, { name: "Whole-grain toast", qty: "1 (30 g)" }],
        steps: ["Whisk 2 eggs (100 g), add 50 g of spinach.", "Cook over medium heat for 4–5 minutes, stirring.", "Serve with the toast (30 g)."]
      }
    },
    {
      title: "Греческий йогурт с гранолой",
      desc: "Йогурт, гранола, мёд",
      calories: 380, protein: 22, fat: 10, carbs: 52, cookingMode: "5", icon: "yogurt",
      ingredients: [{ name: "Йогурт греческий", qty: "200 г" }, { name: "Гранола", qty: "50 г" }, { name: "Мёд", qty: "1 ч.л. (7 г)" }],
      steps: ["Выложите 200 г йогурта в миску.", "Посыпьте 50 г гранолы, полейте 1 ч.л. (7 г) мёда."],
      en: {
        title: "Greek Yogurt with Granola", desc: "Yogurt, granola, honey",
        ingredients: [{ name: "Greek yogurt", qty: "200 g" }, { name: "Granola", qty: "50 g" }, { name: "Honey", qty: "1 tsp (7 g)" }],
        steps: ["Spoon 200 g of yogurt into a bowl.", "Top with 50 g of granola and drizzle with 1 tsp (7 g) of honey."]
      }
    },
    {
      title: "Сырники со сметаной",
      desc: "Творог, яйцо, мука, сметана",
      calories: 400, protein: 26, fat: 16, carbs: 36, cookingMode: "15", icon: "pancake",
      ingredients: [{ name: "Творог 5%", qty: "200 г" }, { name: "Яйцо", qty: "1 шт (50 г)" }, { name: "Мука", qty: "30 г" }, { name: "Сметана", qty: "2 ст.л. (30 г)" }],
      steps: ["Смешайте 200 г творога, яйцо и 30 г муки.", "Слепите сырники и обжарьте по 2–3 минуты с каждой стороны.", "Подавайте со сметаной (30 г)."],
      en: {
        title: "Cottage Cheese Pancakes with Sour Cream", desc: "Cottage cheese, egg, flour, sour cream",
        ingredients: [{ name: "Cottage cheese 5%", qty: "200 g" }, { name: "Egg", qty: "1 (50 g)" }, { name: "Flour", qty: "30 g" }, { name: "Sour cream", qty: "2 tbsp (30 g)" }],
        steps: ["Mix 200 g of cottage cheese, the egg and 30 g of flour.", "Shape into patties and fry 2–3 minutes per side.", "Serve with sour cream (30 g)."]
      }
    },
    {
      title: "Мюсли с ягодами",
      desc: "Мюсли, молоко, ягоды",
      calories: 360, protein: 16, fat: 8, carbs: 58, cookingMode: "5", icon: "oatmeal",
      ingredients: [{ name: "Мюсли", qty: "60 г" }, { name: "Молоко", qty: "180 мл" }, { name: "Ягоды замороженные", qty: "80 г" }],
      steps: ["Залейте 60 г мюсли 180 мл молока.", "Добавьте 80 г ягод сверху — готово."],
      en: {
        title: "Muesli with Berries", desc: "Muesli, milk, berries",
        ingredients: [{ name: "Muesli", qty: "60 g" }, { name: "Milk", qty: "180 ml" }, { name: "Frozen berries", qty: "80 g" }],
        steps: ["Pour 180 ml of milk over 60 g of muesli.", "Add 80 g of berries on top — ready."]
      }
    },
    {
      title: "Творожная запеканка",
      desc: "Творог, яйцо, манка, изюм",
      calories: 390, protein: 28, fat: 12, carbs: 42, cookingMode: "15", icon: "pancake",
      ingredients: [{ name: "Творог 5%", qty: "220 г" }, { name: "Яйцо", qty: "1 шт (50 г)" }, { name: "Манка", qty: "25 г" }, { name: "Изюм", qty: "20 г" }],
      steps: ["Смешайте творог, яйцо, манку и изюм.", "Выложите в форму и запекайте 20 минут при 180°C."],
      en: {
        title: "Baked Cottage Cheese Casserole", desc: "Cottage cheese, egg, semolina, raisins",
        ingredients: [{ name: "Cottage cheese 5%", qty: "220 g" }, { name: "Egg", qty: "1 (50 g)" }, { name: "Semolina", qty: "25 g" }, { name: "Raisins", qty: "20 g" }],
        steps: ["Mix the cottage cheese, egg, semolina and raisins.", "Transfer to a baking dish and bake 20 minutes at 180°C."]
      }
    },
    {
      title: "Блинчики с творогом",
      desc: "Блины на завтрак, творожная начинка",
      calories: 420, protein: 24, fat: 14, carbs: 50, cookingMode: "15", icon: "pancake",
      ingredients: [{ name: "Блины готовые", qty: "3 шт (150 г)" }, { name: "Творог 5%", qty: "150 г" }, { name: "Мёд", qty: "1 ч.л. (7 г)" }],
      steps: ["Смешайте творог с мёдом.", "Заверните начинку в 3 блина.", "При желании разогрейте на сковороде 1–2 минуты."],
      en: {
        title: "Crepes with Cottage Cheese", desc: "Breakfast crepes, cottage cheese filling",
        ingredients: [{ name: "Ready-made crepes", qty: "3 (150 g)" }, { name: "Cottage cheese 5%", qty: "150 g" }, { name: "Honey", qty: "1 tsp (7 g)" }],
        steps: ["Mix the cottage cheese with honey.", "Wrap the filling in 3 crepes.", "Warm in a pan for 1–2 minutes if you like."]
      }
    },
    {
      title: "Протеиновый омлет с творогом",
      desc: "Яйца, творог, помидор",
      calories: 380, protein: 36, fat: 20, carbs: 12, cookingMode: "15", icon: "egg",
      ingredients: [{ name: "Яйца", qty: "3 шт (150 г)" }, { name: "Творог 5%", qty: "100 г" }, { name: "Помидор", qty: "80 г" }],
      steps: ["Взбейте 3 яйца (150 г) и вылейте на разогретую сковороду.", "Через минуту добавьте 100 г творога и нарезанный помидор (80 г).", "Жарьте на среднем огне 4–5 минут, аккуратно перемешивая."],
      en: {
        title: "Protein Omelet with Cottage Cheese", desc: "Eggs, cottage cheese, tomato",
        ingredients: [{ name: "Eggs", qty: "3 (150 g)" }, { name: "Cottage cheese 5%", qty: "100 g" }, { name: "Tomato", qty: "80 g" }],
        steps: ["Whisk 3 eggs (150 g) and pour into a hot pan.", "After a minute add 100 g of cottage cheese and the diced tomato (80 g).", "Cook over medium heat for 4–5 minutes, stirring gently."]
      }
    },
    {
      title: "Протеиновый коктейль с бананом",
      desc: "Протеин, молоко, банан",
      calories: 320, protein: 34, fat: 10, carbs: 22, cookingMode: "5", icon: "shake",
      ingredients: [{ name: "Протеин сывороточный", qty: "30 г" }, { name: "Молоко", qty: "250 мл" }, { name: "Банан", qty: "1/2 шт (60 г)" }],
      steps: ["Взбейте блендером 30 г протеина, 250 мл молока и половину банана (60 г) 30 секунд — готово."],
      en: {
        title: "Banana Protein Shake", desc: "Protein, milk, banana",
        ingredients: [{ name: "Whey protein", qty: "30 g" }, { name: "Milk", qty: "250 ml" }, { name: "Banana", qty: "1/2 (60 g)" }],
        steps: ["Blend 30 g of protein, 250 ml of milk and half a banana (60 g) for 30 seconds — ready."]
      }
    },
    {
      title: "Овсянка с протеином и арахисовой пастой",
      desc: "Овсянка, протеин, арахисовая паста — заряд перед тренировкой",
      calories: 520, protein: 38, fat: 18, carbs: 58, cookingMode: "5", icon: "oatmeal",
      ingredients: [{ name: "Овсяные хлопья", qty: "70 г" }, { name: "Протеин сывороточный", qty: "25 г" }, { name: "Арахисовая паста", qty: "20 г" }, { name: "Молоко", qty: "200 мл" }],
      steps: ["Залейте 70 г овсяных хлопьев 200 мл горячего молока, оставьте на 3 минуты.", "Всыпьте 25 г протеина и размешайте.", "Добавьте 20 г арахисовой пасты сверху."],
      en: {
        title: "Protein Oatmeal with Peanut Butter", desc: "Oats, protein powder, peanut butter — pre-workout fuel",
        ingredients: [{ name: "Oats", qty: "70 g" }, { name: "Whey protein", qty: "25 g" }, { name: "Peanut butter", qty: "20 g" }, { name: "Milk", qty: "200 ml" }],
        steps: ["Pour 200 ml of hot milk over 70 g of oats and let sit for 3 minutes.", "Stir in 25 g of protein powder.", "Top with 20 g of peanut butter."]
      }
    },
    {
      title: "Скрэмбл из яичных белков с индейкой",
      desc: "Яичные белки, индейка, помидоры — постный протеиновый старт",
      calories: 360, protein: 44, fat: 10, carbs: 10, cookingMode: "15", icon: "egg",
      ingredients: [{ name: "Яичные белки", qty: "300 г (8–9 шт)" }, { name: "Индейка отварная", qty: "100 г" }, { name: "Помидоры черри", qty: "80 г" }],
      steps: ["Взбейте яичные белки и вылейте на разогретую сковороду.", "Через минуту добавьте нарезанную индейку (100 г) и помидоры (80 г).", "Жарьте на среднем огне 4–5 минут, помешивая."],
      en: {
        title: "Egg White Scramble with Turkey", desc: "Egg whites, turkey, tomatoes — a lean protein start",
        ingredients: [{ name: "Egg whites", qty: "300 g (8–9 eggs)" }, { name: "Cooked turkey breast", qty: "100 g" }, { name: "Cherry tomatoes", qty: "80 g" }],
        steps: ["Whisk the egg whites and pour into a hot pan.", "After a minute add the diced turkey (100 g) and tomatoes (80 g).", "Cook over medium heat for 4–5 minutes, stirring."]
      }
    }
  ],
  lunch: [
    {
      title: "Собрать за 5 минут",
      desc: "Тунец, авокадо, лаваш, свежие овощи",
      calories: 510, protein: 42, fat: 18, carbs: 40, cookingMode: "5", icon: "wrap",
      ingredients: [{ name: "Тунец консервир.", qty: "1 банка (140 г слитого)" }, { name: "Авокадо", qty: "1 шт (150 г)" }, { name: "Лаваш", qty: "1 шт (60 г)" }, { name: "Овощи свежие", qty: "150 г" }],
      steps: ["Слейте жидкость с банки тунца (140 г) и разомните его вилкой.", "Авокадо (150 г) и овощи (150 г) нарежьте некрупно.", "Выложите тунец, авокадо и овощи на лаваш (60 г) и сверните в рулет."],
      en: {
        title: "5-Minute Wrap", desc: "Tuna, avocado, flatbread, fresh vegetables",
        ingredients: [{ name: "Canned tuna", qty: "1 can (140 g drained)" }, { name: "Avocado", qty: "1 (150 g)" }, { name: "Flatbread", qty: "1 (60 g)" }, { name: "Fresh vegetables", qty: "150 g" }],
        steps: ["Drain the tuna (140 g) and mash it with a fork.", "Roughly chop the avocado (150 g) and vegetables (150 g).", "Layer the tuna, avocado and vegetables on the flatbread (60 g) and roll it up."]
      }
    },
    {
      title: "Боул с курицей и рисом",
      desc: "200 г курицы, 150 г риса, 150 г овощей, оливковое масло",
      calories: 520, protein: 48, fat: 12, carbs: 54, cookingMode: "15", icon: "bowl",
      ingredients: [{ name: "Куриная грудка", qty: "200 г" }, { name: "Рис", qty: "150 г" }, { name: "Овощи замороженные", qty: "150 г" }, { name: "Оливковое масло", qty: "1 ст.л. (14 г)" }],
      steps: ["Разогрейте 150 г риса (готовый пакет — 2 минуты в микроволновке, или заранее сваренный).", "Обжарьте или разогрейте 200 г курицы на сковороде 3–4 минуты до готовности.", "Разморозьте 150 г овощей — 2 минуты в микроволновке или на той же сковороде.", "Соберите всё в тарелке и сбрызните 1 ст.л. (14 г) оливкового масла."],
      en: {
        title: "Chicken and Rice Bowl", desc: "200 g chicken, 150 g rice, 150 g vegetables, olive oil",
        ingredients: [{ name: "Chicken breast", qty: "200 g" }, { name: "Rice", qty: "150 g" }, { name: "Frozen vegetables", qty: "150 g" }, { name: "Olive oil", qty: "1 tbsp (14 g)" }],
        steps: ["Heat 150 g of rice (a ready pouch — 2 minutes in the microwave, or pre-cooked).", "Fry or reheat 200 g of chicken in a pan for 3–4 minutes until done.", "Thaw 150 g of vegetables — 2 minutes in the microwave or in the same pan.", "Combine on a plate and drizzle with 1 tbsp (14 g) of olive oil."]
      }
    },
    {
      title: "Роллы с курицей и овощами",
      desc: "Курица гриль, лаваш, овощи, соус",
      calories: 510, protein: 40, fat: 16, carbs: 46, cookingMode: "5", icon: "wrap",
      ingredients: [{ name: "Курица гриль готовая", qty: "150 г" }, { name: "Лаваш", qty: "1 шт (60 г)" }, { name: "Овощи свежие", qty: "150 г" }, { name: "Соус йогуртовый", qty: "2 ст.л. (30 г)" }],
      steps: ["Нарежьте 150 г курицы и 150 г овощей.", "Выложите на лаваш (60 г), полейте 2 ст.л. (30 г) соуса и сверните в рулет."],
      en: {
        title: "Chicken and Veggie Wrap", desc: "Grilled chicken, flatbread, vegetables, sauce",
        ingredients: [{ name: "Ready grilled chicken", qty: "150 g" }, { name: "Flatbread", qty: "1 (60 g)" }, { name: "Fresh vegetables", qty: "150 g" }, { name: "Yogurt sauce", qty: "2 tbsp (30 g)" }],
        steps: ["Slice 150 g of chicken and 150 g of vegetables.", "Layer on the flatbread (60 g), drizzle with 2 tbsp (30 g) of sauce and roll it up."]
      }
    },
    {
      title: "Паста с курицей и томатами",
      desc: "Паста цельнозерновая, курица, томатный соус",
      calories: 540, protein: 42, fat: 14, carbs: 62, cookingMode: "15", icon: "pasta",
      ingredients: [{ name: "Паста цельнозерн.", qty: "80 г сухой" }, { name: "Куриная грудка", qty: "180 г" }, { name: "Томатный соус", qty: "100 г" }, { name: "Пармезан", qty: "15 г" }],
      steps: ["Отварите 80 г пасты 8–10 минут.", "Обжарьте 180 г курицы кубиками 5–6 минут, добавьте 100 г соуса.", "Смешайте с пастой, посыпьте 15 г пармезана."],
      en: {
        title: "Chicken and Tomato Pasta", desc: "Whole-grain pasta, chicken, tomato sauce",
        ingredients: [{ name: "Whole-grain pasta", qty: "80 g dry" }, { name: "Chicken breast", qty: "180 g" }, { name: "Tomato sauce", qty: "100 g" }, { name: "Parmesan", qty: "15 g" }],
        steps: ["Boil 80 g of pasta for 8–10 minutes.", "Fry 180 g of diced chicken for 5–6 minutes, add 100 g of sauce.", "Toss with the pasta and sprinkle with 15 g of parmesan."]
      }
    },
    {
      title: "Салат с киноа и авокадо",
      desc: "Киноа, авокадо, огурец, фета",
      calories: 500, protein: 20, fat: 26, carbs: 48, cookingMode: "5", icon: "salad",
      ingredients: [{ name: "Киноа отварная", qty: "180 г" }, { name: "Авокадо", qty: "1 шт (150 г)" }, { name: "Огурец", qty: "100 г" }, { name: "Фета", qty: "50 г" }],
      steps: ["Смешайте 180 г готовой киноа с нарезанным авокадо (150 г) и огурцом (100 г).", "Раскрошите 50 г феты сверху."],
      en: {
        title: "Quinoa and Avocado Salad", desc: "Quinoa, avocado, cucumber, feta",
        ingredients: [{ name: "Cooked quinoa", qty: "180 g" }, { name: "Avocado", qty: "1 (150 g)" }, { name: "Cucumber", qty: "100 g" }, { name: "Feta", qty: "50 g" }],
        steps: ["Toss 180 g of cooked quinoa with the diced avocado (150 g) and cucumber (100 g).", "Crumble 50 g of feta on top."]
      }
    },
    {
      title: "Суп-пюре из тыквы с курицей",
      desc: "Тыква, курица, сливки",
      calories: 480, protein: 36, fat: 16, carbs: 46, cookingMode: "15", icon: "soup",
      ingredients: [{ name: "Тыква", qty: "300 г" }, { name: "Куриная грудка", qty: "150 г" }, { name: "Сливки 10%", qty: "50 мл" }, { name: "Хлеб цельнозерн.", qty: "1 кусок (30 г)" }],
      steps: ["Отварите тыкву (300 г) 12–15 минут до мягкости и пробейте блендером со сливками (50 мл).", "Отдельно обжарьте курицу (150 г) 5–6 минут и добавьте в суп.", "Подавайте с хлебом (30 г)."],
      en: {
        title: "Pumpkin Soup with Chicken", desc: "Pumpkin, chicken, cream",
        ingredients: [{ name: "Pumpkin", qty: "300 g" }, { name: "Chicken breast", qty: "150 g" }, { name: "Cream 10%", qty: "50 ml" }, { name: "Whole-grain bread", qty: "1 slice (30 g)" }],
        steps: ["Boil the pumpkin (300 g) 12–15 minutes until soft and blend with 50 ml of cream.", "Separately fry the chicken (150 g) 5–6 minutes and stir into the soup.", "Serve with the bread (30 g)."]
      }
    },
    {
      title: "Буррито-боул с говядиной",
      desc: "Говяжий фарш, рис, фасоль, овощи",
      calories: 560, protein: 44, fat: 18, carbs: 56, cookingMode: "15", icon: "bowl",
      ingredients: [{ name: "Говяжий фарш", qty: "180 г" }, { name: "Рис", qty: "150 г" }, { name: "Фасоль консервир.", qty: "100 г" }, { name: "Овощи свежие", qty: "100 г" }],
      steps: ["Обжарьте 180 г фарша 6–7 минут.", "Разогрейте 150 г риса и 100 г фасоли.", "Соберите в тарелке, добавьте свежие овощи (100 г)."],
      en: {
        title: "Beef Burrito Bowl", desc: "Ground beef, rice, beans, vegetables",
        ingredients: [{ name: "Ground beef", qty: "180 g" }, { name: "Rice", qty: "150 g" }, { name: "Canned beans", qty: "100 g" }, { name: "Fresh vegetables", qty: "100 g" }],
        steps: ["Fry 180 g of ground beef for 6–7 minutes.", "Heat 150 g of rice and 100 g of beans.", "Combine on a plate and add the fresh vegetables (100 g)."]
      }
    },
    {
      title: "Силовой боул: говядина, батат и шпинат",
      desc: "Говядина, запечённый батат, шпинат — на набор массы",
      calories: 620, protein: 46, fat: 20, carbs: 58, cookingMode: "15", icon: "bowl",
      ingredients: [{ name: "Говяжья вырезка", qty: "200 г" }, { name: "Батат", qty: "200 г" }, { name: "Шпинат", qty: "60 г" }, { name: "Оливковое масло", qty: "1 ст.л. (14 г)" }],
      steps: ["Запеките нарезанный батат (200 г) 20 минут при 200°C.", "Обжарьте говядину (200 г) 4–5 минут до готовности.", "Соберите в тарелке со шпинатом (60 г), сбрызните маслом."],
      en: {
        title: "Strength Bowl: Beef, Sweet Potato & Spinach", desc: "Beef, roasted sweet potato, spinach — built for bulking",
        ingredients: [{ name: "Beef tenderloin", qty: "200 g" }, { name: "Sweet potato", qty: "200 g" }, { name: "Spinach", qty: "60 g" }, { name: "Olive oil", qty: "1 tbsp (14 g)" }],
        steps: ["Roast the diced sweet potato (200 g) for 20 minutes at 200°C.", "Sear the beef (200 g) for 4–5 minutes until done.", "Plate with the spinach (60 g) and drizzle with the oil."]
      }
    },
    {
      title: "Киноа с лососем и авокадо",
      desc: "Лосось, киноа, авокадо — омега-3 и качественный белок",
      calories: 560, protein: 40, fat: 26, carbs: 42, cookingMode: "15", icon: "fish",
      ingredients: [{ name: "Лосось", qty: "180 г" }, { name: "Киноа отварная", qty: "150 г" }, { name: "Авокадо", qty: "1 шт (120 г)" }, { name: "Лимон", qty: "0.5 шт (30 г)" }],
      steps: ["Обжарьте или запеките лосось (180 г) 10–12 минут.", "Смешайте с отварной киноа (150 г) и нарезанным авокадо (120 г).", "Сбрызните соком лимона перед подачей."],
      en: {
        title: "Quinoa with Salmon and Avocado", desc: "Salmon, quinoa, avocado — omega-3s and quality protein",
        ingredients: [{ name: "Salmon", qty: "180 g" }, { name: "Cooked quinoa", qty: "150 g" }, { name: "Avocado", qty: "1 (120 g)" }, { name: "Lemon", qty: "0.5 (30 g)" }],
        steps: ["Pan-sear or bake the salmon (180 g) for 10–12 minutes.", "Combine with the cooked quinoa (150 g) and diced avocado (120 g).", "Squeeze the lemon over it before serving."]
      }
    },
    {
      title: "Паста с индейкой и брокколи для спортсменов",
      desc: "Цельнозерновая паста, индейка, брокколи — обед на высокий объём тренировок",
      calories: 600, protein: 48, fat: 14, carbs: 68, cookingMode: "15", icon: "pasta",
      ingredients: [{ name: "Паста цельнозерн.", qty: "90 г сухой" }, { name: "Индейка филе", qty: "200 г" }, { name: "Брокколи", qty: "150 г" }, { name: "Оливковое масло", qty: "1 ст.л. (14 г)" }],
      steps: ["Отварите 90 г пасты 8–10 минут, за 3 минуты до готовности добавьте брокколи (150 г).", "Обжарьте нарезанную индейку (200 г) 5–6 минут.", "Смешайте всё вместе, сбрызните маслом."],
      en: {
        title: "Athlete's Turkey Pasta with Broccoli", desc: "Whole-grain pasta, turkey, broccoli — lunch for a heavy training day",
        ingredients: [{ name: "Whole-grain pasta", qty: "90 g dry" }, { name: "Turkey breast", qty: "200 g" }, { name: "Broccoli", qty: "150 g" }, { name: "Olive oil", qty: "1 tbsp (14 g)" }],
        steps: ["Boil 90 g of pasta for 8–10 minutes, adding the broccoli (150 g) for the last 3 minutes.", "Fry the diced turkey (200 g) for 5–6 minutes.", "Combine everything and drizzle with the oil."]
      }
    }
  ],
  snack: [
    {
      title: "Творог с мёдом",
      desc: "Просто смешать",
      calories: 230, protein: 24, fat: 6, carbs: 20, cookingMode: "5", icon: "yogurt",
      ingredients: [{ name: "Творог 5%", qty: "200 г" }, { name: "Мёд", qty: "1 ч.л. (7 г)" }],
      steps: ["Смешайте 200 г творога с 1 ч.л. (7 г) мёда — готово."],
      en: {
        title: "Cottage Cheese with Honey", desc: "Just mix it",
        ingredients: [{ name: "Cottage cheese 5%", qty: "200 g" }, { name: "Honey", qty: "1 tsp (7 g)" }],
        steps: ["Mix 200 g of cottage cheese with 1 tsp (7 g) of honey — ready."]
      }
    },
    {
      title: "Тосты с авокадо и яйцом пашот",
      desc: "Хлеб, авокадо, яйцо",
      calories: 320, protein: 16, fat: 18, carbs: 26, cookingMode: "15", notEvening: true, icon: "toast",
      ingredients: [{ name: "Хлеб цельнозерн.", qty: "2 куска (60 г)" }, { name: "Авокадо", qty: "1 шт (150 г)" }, { name: "Яйцо", qty: "1 шт (50 г)" }],
      steps: ["Поджарьте 2 куска хлеба (60 г).", "Разомните авокадо (150 г) и намажьте на тосты.", "Сварите яйцо (50 г) пашот 3 минуты и выложите сверху."],
      en: {
        title: "Avocado Toast with Poached Egg", desc: "Bread, avocado, egg",
        ingredients: [{ name: "Whole-grain bread", qty: "2 slices (60 g)" }, { name: "Avocado", qty: "1 (150 g)" }, { name: "Egg", qty: "1 (50 g)" }],
        steps: ["Toast 2 slices of bread (60 g).", "Mash the avocado (150 g) and spread it on the toast.", "Poach the egg (50 g) for 3 minutes and place it on top."]
      }
    },
    {
      title: "Протеиновый батончик и яблоко",
      desc: "Готовый батончик, яблоко",
      calories: 240, protein: 18, fat: 8, carbs: 26, cookingMode: "5", icon: "bar",
      ingredients: [{ name: "Протеиновый батончик", qty: "1 шт (50 г)" }, { name: "Яблоко", qty: "1 шт (150 г)" }],
      steps: ["Готово — просто съешьте батончик (50 г) с яблоком (150 г)."],
      en: {
        title: "Protein Bar and an Apple", desc: "Ready-made bar, apple",
        ingredients: [{ name: "Protein bar", qty: "1 (50 g)" }, { name: "Apple", qty: "1 (150 g)" }],
        steps: ["Ready — just eat the bar (50 g) with the apple (150 g)."]
      }
    },
    {
      title: "Смузи с ягодами и бананом",
      desc: "Кефир, ягоды, банан",
      calories: 300, protein: 14, fat: 6, carbs: 48, cookingMode: "15", icon: "shake",
      ingredients: [{ name: "Кефир", qty: "250 мл" }, { name: "Ягоды замороженные", qty: "100 г" }, { name: "Банан", qty: "1 шт (120 г)" }],
      steps: ["Взбейте 250 мл кефира, 100 г ягод и банан (120 г) блендером 1 минуту."],
      en: {
        title: "Berry Banana Smoothie", desc: "Kefir, berries, banana",
        ingredients: [{ name: "Kefir", qty: "250 ml" }, { name: "Frozen berries", qty: "100 g" }, { name: "Banana", qty: "1 (120 g)" }],
        steps: ["Blend 250 ml of kefir, 100 g of berries and the banana (120 g) for 1 minute."]
      }
    },
    {
      title: "Хумус с овощами",
      desc: "Хумус, морковь, огурец",
      calories: 260, protein: 10, fat: 12, carbs: 30, cookingMode: "5", icon: "bowl",
      ingredients: [{ name: "Хумус", qty: "100 г" }, { name: "Морковь", qty: "80 г" }, { name: "Огурец", qty: "80 г" }],
      steps: ["Нарежьте морковь (80 г) и огурец (80 г) палочками.", "Обмакивайте в 100 г хумуса."],
      en: {
        title: "Hummus with Vegetables", desc: "Hummus, carrot, cucumber",
        ingredients: [{ name: "Hummus", qty: "100 g" }, { name: "Carrot", qty: "80 g" }, { name: "Cucumber", qty: "80 g" }],
        steps: ["Cut the carrot (80 g) and cucumber (80 g) into sticks.", "Dip into 100 g of hummus."]
      }
    },
    {
      title: "Скир с мёдом и миндалём",
      desc: "Скир или творог 0%, миндаль, мёд",
      calories: 260, protein: 26, fat: 9, carbs: 20, cookingMode: "5", icon: "yogurt",
      ingredients: [{ name: "Скир (или творог 0%)", qty: "200 г" }, { name: "Миндаль", qty: "15 г" }, { name: "Мёд", qty: "1 ч.л. (7 г)" }],
      steps: ["Смешайте 200 г скира с 1 ч.л. (7 г) мёда.", "Посыпьте 15 г миндаля сверху."],
      en: {
        title: "Skyr with Honey and Almonds", desc: "Skyr or 0% cottage cheese, almonds, honey",
        ingredients: [{ name: "Skyr (or 0% cottage cheese)", qty: "200 g" }, { name: "Almonds", qty: "15 g" }, { name: "Honey", qty: "1 tsp (7 g)" }],
        steps: ["Mix 200 g of skyr with 1 tsp (7 g) of honey.", "Top with 15 g of almonds."]
      }
    },
    {
      title: "Варёные яйца с сыром",
      desc: "Яйца, твёрдый сыр",
      calories: 240, protein: 20, fat: 17, carbs: 3, cookingMode: "5", icon: "egg",
      ingredients: [{ name: "Яйца", qty: "2 шт (100 г)" }, { name: "Сыр твёрдый", qty: "30 г" }],
      steps: ["Отварите 2 яйца (100 г) вкрутую 8–9 минут.", "Нарежьте сыр (30 г) и подавайте вместе."],
      en: {
        title: "Boiled Eggs with Cheese", desc: "Eggs, hard cheese",
        ingredients: [{ name: "Eggs", qty: "2 (100 g)" }, { name: "Hard cheese", qty: "30 g" }],
        steps: ["Hard-boil 2 eggs (100 g) for 8–9 minutes.", "Slice the cheese (30 g) and serve together."]
      }
    },
    {
      title: "Протеиновый коктейль после тренировки",
      desc: "Протеин, банан, овсянка, молоко — восстановление после тренировки",
      calories: 380, protein: 36, fat: 8, carbs: 44, cookingMode: "5", icon: "shake",
      ingredients: [{ name: "Протеин сывороточный", qty: "30 г" }, { name: "Банан", qty: "1 шт (120 г)" }, { name: "Овсяные хлопья", qty: "30 г" }, { name: "Молоко", qty: "250 мл" }],
      steps: ["Взбейте блендером протеин (30 г), банан (120 г), овсянку (30 г) и молоко (250 мл) 30–40 секунд — готово."],
      en: {
        title: "Post-Workout Recovery Shake", desc: "Protein, banana, oats, milk — refuel right after training",
        ingredients: [{ name: "Whey protein", qty: "30 g" }, { name: "Banana", qty: "1 (120 g)" }, { name: "Oats", qty: "30 g" }, { name: "Milk", qty: "250 ml" }],
        steps: ["Blend the protein (30 g), banana (120 g), oats (30 g) and milk (250 ml) for 30–40 seconds — ready."]
      }
    },
    {
      title: "Творожно-протеиновый пудинг с орехами",
      desc: "Творог, протеин, грецкие орехи — плотный перекус с высоким белком",
      calories: 340, protein: 38, fat: 12, carbs: 20, cookingMode: "5", icon: "yogurt",
      ingredients: [{ name: "Творог 5%", qty: "200 г" }, { name: "Протеин сывороточный", qty: "15 г" }, { name: "Грецкие орехи", qty: "15 г" }],
      steps: ["Смешайте творог (200 г) с протеином (15 г) до однородности.", "Посыпьте измельчёнными орехами (15 г)."],
      en: {
        title: "Cottage Cheese Protein Pudding with Nuts", desc: "Cottage cheese, protein powder, walnuts — a filling high-protein snack",
        ingredients: [{ name: "Cottage cheese 5%", qty: "200 g" }, { name: "Whey protein", qty: "15 g" }, { name: "Walnuts", qty: "15 g" }],
        steps: ["Mix the cottage cheese (200 g) with the protein powder (15 g) until smooth.", "Top with the chopped walnuts (15 g)."]
      }
    }
  ],
  dinner: [
    {
      title: "Салат с тунцом и фасолью",
      desc: "Тунец, фасоль, листья салата, масло",
      calories: 420, protein: 38, fat: 14, carbs: 36, cookingMode: "5", icon: "salad",
      ingredients: [{ name: "Тунец консервир.", qty: "1 банка (140 г слитого)" }, { name: "Фасоль консервир.", qty: "150 г" }, { name: "Листья салата", qty: "100 г" }, { name: "Оливковое масло", qty: "1 ст.л. (14 г)" }],
      steps: ["Слейте жидкость с тунца (140 г) и фасоли (150 г).", "Смешайте всё со 100 г листьев салата и 1 ст.л. (14 г) масла."],
      en: {
        title: "Tuna and Bean Salad", desc: "Tuna, beans, lettuce, oil",
        ingredients: [{ name: "Canned tuna", qty: "1 can (140 g drained)" }, { name: "Canned beans", qty: "150 g" }, { name: "Lettuce", qty: "100 g" }, { name: "Olive oil", qty: "1 tbsp (14 g)" }],
        steps: ["Drain the tuna (140 g) and beans (150 g).", "Toss everything with 100 g of lettuce and 1 tbsp (14 g) of oil."]
      }
    },
    {
      title: "Стейк с овощами на сковороде",
      desc: "Говяжий стейк, овощи на гриле",
      calories: 520, protein: 45, fat: 22, carbs: 20, cookingMode: "15", icon: "steak",
      ingredients: [{ name: "Говяжий стейк", qty: "200 г" }, { name: "Овощи на гриле", qty: "200 г" }, { name: "Оливковое масло", qty: "1 ст.л. (14 г)" }],
      steps: ["Разогрейте сковороду с 1 ст.л. (14 г) масла.", "Обжарьте стейк (200 г) 3–4 минуты с каждой стороны.", "Обжарьте овощи (200 г) рядом 5–7 минут."],
      en: {
        title: "Pan-Seared Steak with Vegetables", desc: "Beef steak, grilled vegetables",
        ingredients: [{ name: "Beef steak", qty: "200 g" }, { name: "Grilled vegetables", qty: "200 g" }, { name: "Olive oil", qty: "1 tbsp (14 g)" }],
        steps: ["Heat a pan with 1 tbsp (14 g) of oil.", "Sear the steak (200 g) 3–4 minutes per side.", "Cook the vegetables (200 g) alongside for 5–7 minutes."]
      }
    },
    {
      title: "Креветки с авокадо и лаймом",
      desc: "Креветки готовые, авокадо, лайм",
      calories: 400, protein: 36, fat: 16, carbs: 22, cookingMode: "5", icon: "shrimp",
      ingredients: [{ name: "Креветки варёные", qty: "200 г" }, { name: "Авокадо", qty: "1 шт (150 г)" }, { name: "Лайм", qty: "0.5 шт (30 г)" }],
      steps: ["Разомните авокадо (150 г) вилкой, сбрызните соком лайма.", "Смешайте с 200 г креветок — готово."],
      en: {
        title: "Shrimp with Avocado and Lime", desc: "Cooked shrimp, avocado, lime",
        ingredients: [{ name: "Cooked shrimp", qty: "200 g" }, { name: "Avocado", qty: "1 (150 g)" }, { name: "Lime", qty: "0.5 (30 g)" }],
        steps: ["Mash the avocado (150 g) with a fork and squeeze in the lime juice.", "Mix in the shrimp (200 g) — ready."]
      }
    },
    {
      title: "Лосось с овощами на пару",
      desc: "Лосось, брокколи, морковь",
      calories: 500, protein: 42, fat: 24, carbs: 18, cookingMode: "15", icon: "fish",
      ingredients: [{ name: "Лосось", qty: "200 г" }, { name: "Брокколи", qty: "150 г" }, { name: "Морковь", qty: "80 г" }, { name: "Оливковое масло", qty: "1 ст.л. (14 г)" }],
      steps: ["Готовьте лосось (200 г) на пару или в духовке 12–15 минут.", "Приготовьте на пару брокколи (150 г) и морковь (80 г) 8–10 минут.", "Сбрызните 1 ст.л. (14 г) масла перед подачей."],
      en: {
        title: "Steamed Salmon with Vegetables", desc: "Salmon, broccoli, carrot",
        ingredients: [{ name: "Salmon", qty: "200 g" }, { name: "Broccoli", qty: "150 g" }, { name: "Carrot", qty: "80 g" }, { name: "Olive oil", qty: "1 tbsp (14 g)" }],
        steps: ["Steam or bake the salmon (200 g) for 12–15 minutes.", "Steam the broccoli (150 g) and carrot (80 g) for 8–10 minutes.", "Drizzle with 1 tbsp (14 g) of oil before serving."]
      }
    },
    {
      title: "Треска, запечённая с овощами",
      desc: "Треска, кабачок, помидоры",
      calories: 400, protein: 40, fat: 12, carbs: 24, cookingMode: "15", icon: "fish",
      ingredients: [{ name: "Треска", qty: "220 г" }, { name: "Кабачок", qty: "150 г" }, { name: "Помидоры черри", qty: "100 г" }, { name: "Оливковое масло", qty: "1 ст.л. (14 г)" }],
      steps: ["Выложите треску (220 г) и нарезанные овощи на противень.", "Сбрызните маслом, запекайте 18–20 минут при 200°C."],
      en: {
        title: "Baked Cod with Vegetables", desc: "Cod, zucchini, tomatoes",
        ingredients: [{ name: "Cod", qty: "220 g" }, { name: "Zucchini", qty: "150 g" }, { name: "Cherry tomatoes", qty: "100 g" }, { name: "Olive oil", qty: "1 tbsp (14 g)" }],
        steps: ["Place the cod (220 g) and sliced vegetables on a baking sheet.", "Drizzle with oil and bake 18–20 minutes at 200°C."]
      }
    },
    {
      title: "Омлет с индейкой и овощами",
      desc: "Яйца, индейка, овощи",
      calories: 420, protein: 38, fat: 20, carbs: 14, cookingMode: "5", icon: "egg",
      ingredients: [{ name: "Яйца", qty: "3 шт (150 г)" }, { name: "Индейка отварная", qty: "120 г" }, { name: "Овощи свежие", qty: "100 г" }],
      steps: ["Взбейте 3 яйца, добавьте нарезанную индейку (120 г) и овощи (100 г).", "Жарьте на среднем огне 5–6 минут под крышкой."],
      en: {
        title: "Turkey and Vegetable Omelet", desc: "Eggs, turkey, vegetables",
        ingredients: [{ name: "Eggs", qty: "3 (150 g)" }, { name: "Cooked turkey", qty: "120 g" }, { name: "Fresh vegetables", qty: "100 g" }],
        steps: ["Whisk 3 eggs, add the diced turkey (120 g) and vegetables (100 g).", "Cook over medium heat, covered, for 5–6 minutes."]
      }
    },
    {
      title: "Чечевичный суп с курицей",
      desc: "Чечевица, курица, овощи",
      calories: 450, protein: 40, fat: 10, carbs: 46, cookingMode: "15", icon: "soup",
      ingredients: [{ name: "Чечевица красная", qty: "100 г" }, { name: "Куриная грудка", qty: "150 г" }, { name: "Овощи свежие", qty: "100 г" }],
      steps: ["Отварите 100 г чечевицы 15 минут с овощами (100 г).", "Добавьте нарезанную курицу (150 г), варите ещё 5 минут."],
      en: {
        title: "Lentil Soup with Chicken", desc: "Lentils, chicken, vegetables",
        ingredients: [{ name: "Red lentils", qty: "100 g" }, { name: "Chicken breast", qty: "150 g" }, { name: "Fresh vegetables", qty: "100 g" }],
        steps: ["Boil 100 g of lentils with the vegetables (100 g) for 15 minutes.", "Add the diced chicken (150 g) and simmer 5 more minutes."]
      }
    },
    {
      title: "Лосось с киноа и спаржей",
      desc: "Лосось, киноа, спаржа — ужин на восстановление",
      calories: 580, protein: 44, fat: 26, carbs: 40, cookingMode: "15", icon: "fish",
      ingredients: [{ name: "Лосось", qty: "200 г" }, { name: "Киноа отварная", qty: "150 г" }, { name: "Спаржа", qty: "120 г" }, { name: "Оливковое масло", qty: "1 ст.л. (14 г)" }],
      steps: ["Запеките лосось (200 г) 12–15 минут при 200°C.", "Обжарьте спаржу (120 г) 4–5 минут.", "Подавайте с киноа (150 г), сбрызнув маслом."],
      en: {
        title: "Salmon Steak with Quinoa and Asparagus", desc: "Salmon, quinoa, asparagus — a recovery dinner",
        ingredients: [{ name: "Salmon", qty: "200 g" }, { name: "Cooked quinoa", qty: "150 g" }, { name: "Asparagus", qty: "120 g" }, { name: "Olive oil", qty: "1 tbsp (14 g)" }],
        steps: ["Bake the salmon (200 g) for 12–15 minutes at 200°C.", "Sauté the asparagus (120 g) for 4–5 minutes.", "Serve with the quinoa (150 g), drizzled with the oil."]
      }
    },
    {
      title: "Куриные бёдра с рисом и брокколи",
      desc: "Куриные бёдра, рис, брокколи — плотная порция на набор массы",
      calories: 640, protein: 46, fat: 22, carbs: 60, cookingMode: "15", icon: "bowl",
      ingredients: [{ name: "Куриные бёдра без кожи", qty: "220 г" }, { name: "Рис", qty: "180 г" }, { name: "Брокколи", qty: "150 г" }, { name: "Оливковое масло", qty: "1 ст.л. (14 г)" }],
      steps: ["Обжарьте куриные бёдра (220 г) 10–12 минут до готовности.", "Отварите или разогрейте рис (180 г).", "Приготовьте брокколи (150 г) на пару 5–6 минут, сбрызните маслом."],
      en: {
        title: "Chicken Thighs with Rice and Broccoli", desc: "Chicken thighs, rice, broccoli — a hearty bulking portion",
        ingredients: [{ name: "Skinless chicken thighs", qty: "220 g" }, { name: "Rice", qty: "180 g" }, { name: "Broccoli", qty: "150 g" }, { name: "Olive oil", qty: "1 tbsp (14 g)" }],
        steps: ["Cook the chicken thighs (220 g) for 10–12 minutes until done.", "Boil or reheat the rice (180 g).", "Steam the broccoli (150 g) for 5–6 minutes and drizzle with the oil."]
      }
    },
    {
      title: "Говяжий фарш с гречкой и овощами",
      desc: "Говяжий фарш, гречка, овощи — сытный ужин с высоким белком",
      calories: 600, protein: 44, fat: 22, carbs: 48, cookingMode: "15", icon: "steak",
      ingredients: [{ name: "Говяжий фарш", qty: "200 г" }, { name: "Гречка отварная", qty: "180 г" }, { name: "Овощи свежие", qty: "120 г" }],
      steps: ["Обжарьте фарш (200 г) 7–8 минут.", "Смешайте с отварной гречкой (180 г).", "Подавайте со свежими овощами (120 г)."],
      en: {
        title: "Ground Beef with Buckwheat and Vegetables", desc: "Ground beef, buckwheat, vegetables — a filling high-protein dinner",
        ingredients: [{ name: "Ground beef", qty: "200 g" }, { name: "Cooked buckwheat", qty: "180 g" }, { name: "Fresh vegetables", qty: "120 g" }],
        steps: ["Brown the ground beef (200 g) for 7–8 minutes.", "Mix with the cooked buckwheat (180 g).", "Serve with the fresh vegetables (120 g)."]
      }
    }
  ]
};
