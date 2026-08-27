# AI Food Coach — веб-версия (каркас)

Next.js 14 + Supabase. Проверено: `npm run build` собирается без ошибок.

Реализовано по-настоящему (пишет и читает из базы, не заглушки):
- Регистрация и вход: email/пароль **и** Google
- Онбординг (возраст, вес, рост, тренировки в неделю) → считает норму КБЖУ → сохраняет в `profiles`
- Экран «Сегодня» → читает профиль и приёмы пищи пользователя
- «Заказать продукты» → реально добавляет ингредиенты в `grocery_items`
- «Корзина» → единый список покупок с чекбоксом «куплено» (`grocery_items.bought`)
- Профиль → показывает реальные данные, выход из аккаунта

Заглушки (страница есть, логики пока нет — следующий шаг):
- «План» (таблица `meals` уже создана, нужно вывести по дням)
- «Коуч» (нужен вызов LLM с контекстом остатка КБЖУ)
- Напоминания вечером (таблица `reminder_settings` создана, нужен cron/edge function)

## 1. Настройка Supabase

1. Создайте проект на supabase.com
2. Откройте SQL Editor → вставьте содержимое `supabase/schema.sql` → Run
3. Authentication → Providers → включите Email и Google (для Google нужен Client ID/Secret из Google Cloud Console)
4. Authentication → URL configuration → добавьте redirect URL: `https://ваш-домен/auth/callback`
5. Project Settings → API → скопируйте `URL` и `anon public key`

## 2. Локальный запуск

```bash
cp .env.example .env.local
# впишите NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Откройте http://localhost:3000

## 3. Деплой на свой сервер (Docker)

На сервере должен быть установлен Docker и docker-compose.

```bash
git clone <ваш-репозиторий>
cd food-coach-web
cp .env.example .env
# впишите те же переменные в .env
docker compose up -d --build
```

Приложение поднимется на порту 3000. Дальше повесьте перед ним Nginx (или Caddy) с вашим доменом и SSL-сертификатом (Let's Encrypt), проксируя на `127.0.0.1:3000`.

Пример конфига Nginx:

```
server {
    listen 80;
    server_name ваш-домен.ру;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

После этого — `sudo certbot --nginx -d ваш-домен.ру` для SSL.

## 4. Структура базы (supabase/schema.sql)

- `profiles` — возраст/вес/рост/тренировки/цели по КБЖУ/тема оформления
- `training_schedule` — расписание тренировок по дням недели
- `meals` — приёмы пищи по датам, статус planned/eaten/changed/skipped
- `grocery_items` — единый список покупок, `bought` отмечает купленное (таблица `cart_items` больше не используется)
- `fridge_items` — что есть дома
- `reminder_settings` — включено ли напоминание и во сколько

Всё защищено Row Level Security — пользователь физически не может увидеть чужие данные.

## Дальнейшие шаги

1. Экран «План» — подтянуть `meals` по датам недели
2. Экран «Коуч» — API route, который берёт остаток КБЖУ пользователя и шлёт запрос к LLM
3. Вечерние напоминания — Supabase Edge Function по расписанию (cron), отправляющая push/email за день вперёд
4. Перенести остальные экраны макета (Холодильник, Фото еды, Смена блюда) по той же схеме: server component читает Supabase → server action пишет
