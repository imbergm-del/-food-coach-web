-- Run this in Supabase SQL editor (Project -> SQL Editor -> New query)

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  age int,
  weight_kg numeric,
  height_cm numeric,
  workouts_per_week int default 0,
  phone text,
  timezone text,                  -- IANA-название часового пояса (America/New_York), определяется браузером
  cooking_mode text default '5',
  theme text default 'field',
  protein_target int default 120,
  fat_target int default 70,
  carb_target int default 200,
  cal_target int default 2000,
  breakfast_time time default '08:00',  -- личное расписание приёмов пищи — на нём завязано
  lunch_time time default '13:00',      -- переключение "следующего приёма" на /today и SMS-напоминания
  snack_time time default '16:30',
  dinner_time time default '19:30',
  created_at timestamptz default now()
);

create table if not exists training_schedule (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  weekday int not null,          -- 0 = Monday ... 6 = Sunday
  workout_type text not null,    -- strength / cardio / boxing / rest
  label text
);

create table if not exists meals (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  meal_type text not null,       -- breakfast / lunch / snack / dinner
  title text,
  ingredients jsonb default '[]',
  steps jsonb default '[]',
  calories int, protein int, fat int, carbs int,
  status text default 'planned', -- planned / eaten / changed / skipped / photo_logged
  source text default 'home',
  created_at timestamptz default now()
);

create table if not exists cart_items (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  quantity text,
  from_meal_id bigint references meals(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists grocery_items (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  status text default 'need',    -- need / have / low_stock
  created_at timestamptz default now()
);

create table if not exists fridge_items (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  quantity text
);

create table if not exists reminder_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean default true,
  meal_reminders_enabled boolean default false,  -- SMS за час до каждого приёма
  send_at time default '20:00'
);

-- Не даёт слать одно и то же SMS-напоминание о приёме дважды за день
-- (крон проверяет чаще, чем раз в день, чтобы попасть в нужный часовой пояс).
create table if not exists meal_reminder_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  meal_type text not null,        -- breakfast / lunch / snack / dinner / evening_plan
  sent_at timestamptz default now(),
  unique (user_id, date, meal_type)
);

-- Миграция для уже существующей базы (create table if not exists выше не добавит
-- колонки в таблицу, которая уже была создана раньше без них):
alter table profiles add column if not exists timezone text;
alter table profiles add column if not exists email text;
alter table profiles add column if not exists breakfast_time time default '08:00';
alter table profiles add column if not exists lunch_time time default '13:00';
alter table profiles add column if not exists snack_time time default '16:30';
alter table profiles add column if not exists dinner_time time default '19:30';
alter table reminder_settings add column if not exists meal_reminders_enabled boolean default false;
alter table meals add column if not exists steps jsonb default '[]';

-- Заполняем email для аккаунтов, созданных до того, как колонка появилась
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- Row Level Security: every user only ever sees their own rows
alter table profiles enable row level security;
alter table training_schedule enable row level security;
alter table meals enable row level security;
alter table cart_items enable row level security;
alter table grocery_items enable row level security;
alter table fridge_items enable row level security;
alter table reminder_settings enable row level security;
alter table meal_reminder_log enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own schedule" on training_schedule for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own meals" on meals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own cart" on cart_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own groceries" on grocery_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own fridge" on fridge_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own reminders" on reminder_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own meal reminder log" on meal_reminder_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name) values (new.id, new.email, new.raw_user_meta_data->>'name');
  insert into public.reminder_settings (user_id) values (new.id);
  insert into public.fridge_items (user_id, name, quantity) values
    (new.id, 'Курица', '600 г'), (new.id, 'Яйца', '8 шт'), (new.id, 'Греч. йогурт', '3 шт'), (new.id, 'Рис', 'мало');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
