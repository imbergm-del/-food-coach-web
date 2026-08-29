import type { Lang } from "@/lib/language";

export type { Lang };

type Dict = Record<string, string>;

// Небольшой словарь по экранам вместо flat-списка на всё приложение — так легче
// найти нужную строку и не потерять контекст при переводе. Секции покрывают пока
// только основной ежедневный путь (вход, анкета, главная, навигация) — остальные
// экраны переводятся следующим шагом.
function section(ru: Dict, en: Dict): Record<Lang, Dict> {
  return { ru, en };
}

export function t(dict: Record<Lang, Dict>, lang: Lang, key: string): string {
  return dict[lang]?.[key] ?? dict.ru[key] ?? key;
}

export const nav = section(
  { today: "Сегодня", plan: "План", log: "Записать", cart: "Корзина", coach: "Коуч" },
  { today: "Today", plan: "Plan", log: "Log", cart: "Cart", coach: "Coach" }
);

export const login = section(
  {
    brand: "AI Food Coach",
    welcomeBack: "С возвращением",
    createAccount: "Создать аккаунт",
    email: "Email",
    password: "Пароль",
    signIn: "Войти",
    signUp: "Зарегистрироваться",
    working: "Секунду…",
    or: "или",
    continueWithGoogle: "Продолжить с Google",
    noAccount: "Нет аккаунта? Зарегистрироваться",
    haveAccount: "Уже есть аккаунт? Войти",
    fillBoth: "Заполните email и пароль.",
    errEmailNotConfirmed: "Подтвердите email перед продолжением.",
    errInvalidCreds: "Неверный email или пароль.",
    errAlreadyRegistered: "Этот email уже зарегистрирован — попробуйте войти.",
    errSlow: "Сервис входа сейчас отвечает медленно. Попробуйте ещё раз через минуту."
  },
  {
    brand: "AI Food Coach",
    welcomeBack: "Welcome back",
    createAccount: "Create account",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signUp: "Sign up",
    working: "One sec…",
    or: "or",
    continueWithGoogle: "Continue with Google",
    noAccount: "No account? Sign up",
    haveAccount: "Already have an account? Sign in",
    fillBoth: "Fill in your email and password.",
    errEmailNotConfirmed: "Please confirm your email before next step.",
    errInvalidCreds: "Wrong email or password.",
    errAlreadyRegistered: "This email is already registered — try signing in.",
    errSlow: "The sign-in service is responding slowly right now. Please try again in a minute."
  }
);

export const onboarding = section(
  {
    step: "Шаг 1 из 1",
    title: "Расскажите о себе",
    subtitle: "Это нужно, чтобы сразу посчитать вашу норму — без лишних вопросов.",
    name: "Как вас зовут",
    namePlaceholder: "Например, Майк",
    sex: "Пол",
    male: "Мужской",
    female: "Женский",
    age: "Возраст",
    agePlaceholder: "Например, 35",
    weight: "Вес, кг",
    weightPlaceholder: "Например, 82",
    height: "Рост, см",
    heightPlaceholder: "Например, 180",
    workouts: "Тренировок в неделю",
    workoutsPlaceholder: "Например, 3",
    submit: "Создать мой план",
    saving: "Сохраняем…",
    invalid: "Проверьте значения — заполните все поля, включая имя, реальными данными."
  },
  {
    step: "Step 1 of 1",
    title: "Tell us about yourself",
    subtitle: "We need this to calculate your daily targets right away — no extra questions.",
    name: "Your name",
    namePlaceholder: "e.g. Mike",
    sex: "Sex",
    male: "Male",
    female: "Female",
    age: "Age",
    agePlaceholder: "e.g. 35",
    weight: "Weight, kg",
    weightPlaceholder: "e.g. 82",
    height: "Height, cm",
    heightPlaceholder: "e.g. 180",
    workouts: "Workouts per week",
    workoutsPlaceholder: "e.g. 3",
    submit: "Create my plan",
    saving: "Saving…",
    invalid: "Please check your entries — fill in every field, including your name, with real values."
  }
);

export const today = section(
  {
    greetingNight: "Доброй ночи", greetingMorning: "Доброе утро", greetingDay: "Добрый день", greetingEvening: "Добрый вечер",
    today: "СЕГОДНЯ",
    whatsYourName: "Как к вам обращаться?",
    namePlaceholder: "Ваше имя",
    save: "Сохранить",
    saving: "…",
    lateNotice: "Поздний час — приёмы на сегодня позади, дальше речь про завтра,",
    whatYouAte: "Что вы сегодня съели",
    water: "Вода",
    ml: "мл",
    plus250: "+250 мл",
    plus500: "+500 мл",
    reset: "Сброс",
    howMuchTime: "Сколько времени есть на еду",
    manualNotice: "Этот приём вы задали вручную — но время на готовку всё ещё можно поменять ниже.",
    nextMeal: "Следующий приём",
    ate: "Съел",
    replace: "Заменить",
    moreOptions: "Ещё варианты — фото, ресторан, голоден сейчас",
    allDone: "Все приёмы отмечены ✓",
    checkBackLater: "Загляните позже — план продолжится дальше по приёмам.",
    reminderEyebrow: "Напоминание придёт сегодня в 20:00",
    reminderTitle: "Ваше питание на завтра готово",
    view: "Смотреть"
  },
  {
    greetingNight: "Good night", greetingMorning: "Good morning", greetingDay: "Good afternoon", greetingEvening: "Good evening",
    today: "TODAY",
    whatsYourName: "What should we call you?",
    namePlaceholder: "Your name",
    save: "Save",
    saving: "…",
    lateNotice: "It's late — today's meals are behind us, so this is about tomorrow,",
    whatYouAte: "What you ate today",
    water: "Water",
    ml: "ml",
    plus250: "+250 ml",
    plus500: "+500 ml",
    reset: "Reset",
    howMuchTime: "How much time do you have to eat",
    manualNotice: "You set this meal manually — but you can still change the cooking time below.",
    nextMeal: "Next meal",
    ate: "Ate it",
    replace: "Swap",
    moreOptions: "More options — photo, restaurant, hungry now",
    allDone: "All meals logged ✓",
    checkBackLater: "Check back later — the plan will continue with the next meal.",
    reminderEyebrow: "A reminder arrives today at 8pm",
    reminderTitle: "Your meals for tomorrow are ready",
    view: "View"
  }
);

export const coach = section(
  {
    eyebrow: "ИИ-коуч", title: "Чем помочь?",
    starter1: "Что съесть прямо сейчас?",
    starter2: "Хочу что-то сладкое, но в рамках нормы",
    starter3: "Собери ужин из того, что обычно есть дома",
    intro: "Спросите что-нибудь, учитывая остаток КБЖУ на сегодня, или сфотографируйте продукты — подберу рецепт из того, что видно на фото:",
    thinking: "Коуч думает…",
    photoAttached: "Фото прикреплено",
    photoDefaultMessage: "Вот что у меня есть дома — подбери рецепт из этого.",
    inputPlaceholderWithPhoto: "Например: что приготовить из этого?",
    inputPlaceholder: "Спросите коуча…",
    attachPhoto: "Прикрепить фото продуктов",
    send: "Отправить",
    errPhoto: "Не получилось обработать фото. Попробуйте ещё раз.",
    errGeneric: "Что-то пошло не так.",
    errNoConnection: "Нет связи с сервером. Проверьте интернет и попробуйте снова."
  },
  {
    eyebrow: "AI coach", title: "How can I help?",
    starter1: "What should I eat right now?",
    starter2: "I want something sweet but within my targets",
    starter3: "Put together a dinner from what I usually have at home",
    intro: "Ask anything, taking into account today's remaining macros, or photograph your ingredients — I'll suggest a recipe from what's in the photo:",
    thinking: "Coach is thinking…",
    photoAttached: "Photo attached",
    photoDefaultMessage: "Here's what I have at home — suggest a recipe from this.",
    inputPlaceholderWithPhoto: "e.g. what can I cook with this?",
    inputPlaceholder: "Ask the coach…",
    attachPhoto: "Attach a photo of ingredients",
    send: "Send",
    errPhoto: "Couldn't process the photo. Please try again.",
    errGeneric: "Something went wrong.",
    errNoConnection: "Can't reach the server. Check your connection and try again."
  }
);

export const settings = section(
  { language: "Язык", languageDesc: "Меняет язык интерфейса и ИИ-подборок (коуч, рецепты и т.д.)." },
  { language: "Language", languageDesc: "Changes the language of the interface and AI suggestions (coach, recipes, etc.)." }
);
