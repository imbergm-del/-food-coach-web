import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { mealTypeLabel, MEAL_SEQUENCE, getMealSchedule, type MealType } from "@/lib/mealTypes";
import { MEAL_POOL, localizeMeal } from "@/lib/mealMenu";
import { pickMealForDate } from "@/lib/mealRotation";
import { scaleMealToTarget } from "@/lib/scaleMeal";
import { nowInTz, todayISOInTz, addDaysISO } from "@/lib/userTime";
import type { Lang } from "@/lib/language";

// Triggered every 15 minutes by Vercel Cron (see vercel.json), which sends the secret
// as a Bearer header. A "?secret=" query param is also accepted so this can be
// triggered manually from a browser for testing. Runs frequently (rather than once a
// day) so each user's own local time is checked, not one fixed UTC moment — otherwise
// "20:00" or "an hour before lunch" only lines up for whichever timezone the fixed
// cron time happens to match.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const authHeader = req.headers.get("authorization");
  const querySecret = url.searchParams.get("secret");
  const authorized =
    !process.env.CRON_SECRET ||
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    querySecret === process.env.CRON_SECRET;

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const smsConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
  const emailConfigured = !!process.env.RESEND_API_KEY;
  if (!smsConfigured && !emailConfigured) {
    return NextResponse.json({ skipped: "Ни TWILIO_*, ни RESEND_API_KEY не настроены — напоминания не отправлены." });
  }

  const supabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://food-coach-web.vercel.app";

  const { data: settings, error } = await supabase.from("reminder_settings").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!settings?.length) return NextResponse.json({ sentSms: 0, sentEmail: 0, note: "Нет строк в reminder_settings." });

  async function sendSms(to: string, body: string) {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ To: to, From: process.env.TWILIO_FROM_NUMBER!, Body: body })
      }
    );
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  }

  async function sendEmail(to: string, subject: string, html: string) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.REMINDER_FROM_EMAIL ?? "AI Food Coach <onboarding@resend.dev>", to, subject, html })
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  }

  // Отмечаем отправку ТОЛЬКО после реального успеха — иначе неудачная попытка Twilio
  // (сеть, лимит и т.п.) навсегда блокирует повтор на следующий тик крона.
  async function alreadySent(userId: string, date: string, mealType: string) {
    const { data } = await supabase
      .from("meal_reminder_log").select("id").eq("user_id", userId).eq("date", date).eq("meal_type", mealType).maybeSingle();
    return !!data;
  }
  async function markSent(userId: string, date: string, mealType: string) {
    await supabase.from("meal_reminder_log").insert({ user_id: userId, date, meal_type: mealType });
  }

  let sentSms = 0, sentEmail = 0, failed = 0;
  const details: string[] = [];

  for (const s of settings) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone, email, timezone, cooking_mode, cal_target, breakfast_time, lunch_time, snack_time, dinner_time, language")
      .eq("id", s.user_id).single();
    if (!profile) continue;

    const lang: Lang = profile.language === "en" ? "en" : "ru";
    const en = lang === "en";
    const schedule = getMealSchedule(profile);

    const now = nowInTz(profile.timezone);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const today = todayISOInTz(profile.timezone);

    // 1) Вечерний план на завтра — окно в час (не 15 минут), чтобы дрожание крона
    // по секундам не сдвигало тик мимо узкой границы, как это уже случалось.
    if (s.enabled && nowMinutes >= 20 * 60 && nowMinutes < 20 * 60 + 60 && !(await alreadySent(s.user_id, today, "evening_plan"))) {
      const tomorrow = addDaysISO(today, 1);
      const { data: plannedMeals } = await supabase
        .from("meals").select("meal_type, title").eq("user_id", s.user_id).eq("date", tomorrow);
      const planLines = (plannedMeals ?? []).map(
        m => `${mealTypeLabel(m.meal_type as MealType, lang)}: ${m.title}`
      );
      const planSummary = planLines.length ? planLines.join("; ") : (en ? "tomorrow's plan isn't ready yet — open the app" : "план на завтра ещё не составлен — откройте приложение");

      if (smsConfigured && profile.phone) {
        try {
          await sendSms(profile.phone, en
            ? `AI Food Coach: your meals for tomorrow — ${planSummary}. Details: ${appUrl}/reminders`
            : `AI Food Coach: ваше питание на завтра — ${planSummary}. Подробнее: ${appUrl}/reminders`);
          await markSent(s.user_id, today, "evening_plan");
          sentSms++;
        } catch (err) {
          failed++;
          details.push(`Вечернее SMS → ${profile.phone}: ${err instanceof Error ? err.message : String(err)}`);
        }
      } else if (emailConfigured && profile.email) {
        try {
          await sendEmail(
            profile.email,
            en ? "Your meals for tomorrow are ready" : "Ваше питание на завтра готово",
            en
              ? `<p>${planSummary}</p><p><a href="${appUrl}/reminders">Open the reminder</a></p>`
              : `<p>${planSummary}</p><p><a href="${appUrl}/reminders">Открыть напоминание</a></p>`
          );
          await markSent(s.user_id, today, "evening_plan");
          sentEmail++;
        } catch (err) {
          failed++;
          details.push(`Вечерний email → ${profile.email}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    // 2) SMS за 30 минут до приёма — окно от (время приёма - 30 мин) до самого времени
    // приёма, а не узкая 15-минутная щель: крон срабатывает примерно каждые 15 минут,
    // но не секунда в секунду, и узкое окно из-за этого реально пропускало тик.
    if (s.meal_reminders_enabled && smsConfigured && profile.phone) {
      for (const mealType of MEAL_SEQUENCE) {
        const target = schedule[mealType];
        const mealMinutes = target.hour * 60 + target.minute;
        const reminderMinutes = mealMinutes - 30;
        if (nowMinutes < reminderMinutes || nowMinutes >= mealMinutes) continue;
        if (await alreadySent(s.user_id, today, mealType)) continue;

        const { data: mealsToday } = await supabase
          .from("meals").select("title, status").eq("user_id", s.user_id).eq("date", today).eq("meal_type", mealType);
        let title = mealsToday?.find(m => m.status === "planned")?.title ?? mealsToday?.[0]?.title;
        if (!title) {
          title = scaleMealToTarget(
            localizeMeal(pickMealForDate(MEAL_POOL[mealType as MealType], today), lang), mealType as MealType, profile.cal_target ?? 2200
          ).title;
        }

        try {
          await sendSms(profile.phone, en
            ? `AI Food Coach: in 30 minutes — ${mealTypeLabel(mealType, lang)}: ${title}. Details: ${appUrl}/today`
            : `AI Food Coach: через 30 минут — ${mealTypeLabel(mealType, lang)}: ${title}. Подробнее: ${appUrl}/today`);
          await markSent(s.user_id, today, mealType);
          sentSms++;
        } catch (err) {
          failed++;
          details.push(`SMS за 30 минут (${mealType}) → ${profile.phone}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  return NextResponse.json({ sentSms, sentEmail, failed, details });
}
