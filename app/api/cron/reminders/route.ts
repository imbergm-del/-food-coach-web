import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { MEAL_TYPE_LABELS, MEAL_SEQUENCE, MEAL_TIME_DEFAULTS, type MealType } from "@/lib/mealTypes";
import { MEAL_POOL } from "@/lib/mealMenu";
import { pickMealForDate } from "@/lib/mealRotation";
import { scaleMealToTarget } from "@/lib/scaleMeal";
import { nowInTz, todayISOInTz, addDaysISO } from "@/lib/userTime";

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

  // true если вставка удалась (ещё не отправляли), false если запись уже есть (дубль)
  async function markSentOnce(userId: string, date: string, mealType: string) {
    const { error: insertError } = await supabase.from("meal_reminder_log").insert({ user_id: userId, date, meal_type: mealType });
    return !insertError;
  }

  let sentSms = 0, sentEmail = 0, failed = 0;
  const details: string[] = [];

  for (const s of settings) {
    const { data: profile } = await supabase
      .from("profiles").select("phone, email, timezone, cooking_mode, cal_target").eq("id", s.user_id).single();
    if (!profile) continue;

    const now = nowInTz(profile.timezone);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const today = todayISOInTz(profile.timezone);

    // 1) Вечерний план на завтра — было и раньше, теперь по локальному времени пользователя
    if (s.enabled && nowMinutes >= 20 * 60 && nowMinutes < 20 * 60 + 15) {
      const isNew = await markSentOnce(s.user_id, today, "evening_plan");
      if (isNew) {
        const tomorrow = addDaysISO(today, 1);
        const { data: plannedMeals } = await supabase
          .from("meals").select("meal_type, title").eq("user_id", s.user_id).eq("date", tomorrow);
        const planLines = (plannedMeals ?? []).map(
          m => `${MEAL_TYPE_LABELS[m.meal_type as keyof typeof MEAL_TYPE_LABELS] ?? m.meal_type}: ${m.title}`
        );
        const planSummary = planLines.length ? planLines.join("; ") : "план на завтра ещё не составлен — откройте приложение";

        if (smsConfigured && profile.phone) {
          try {
            await sendSms(profile.phone, `AI Food Coach: ваше питание на завтра — ${planSummary}. Подробнее: ${appUrl}/reminders`);
            sentSms++;
          } catch (err) {
            failed++;
            details.push(`Вечернее SMS → ${profile.phone}: ${err instanceof Error ? err.message : String(err)}`);
          }
        } else if (emailConfigured && profile.email) {
          try {
            await sendEmail(profile.email, "Ваше питание на завтра готово", `<p>${planSummary}</p><p><a href="${appUrl}/reminders">Открыть напоминание</a></p>`);
            sentEmail++;
          } catch (err) {
            failed++;
            details.push(`Вечерний email → ${profile.email}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
    }

    // 2) SMS за час до приёма — новая функция, включается отдельно и только по SMS
    if (s.meal_reminders_enabled && smsConfigured && profile.phone) {
      for (const mealType of MEAL_SEQUENCE) {
        const target = MEAL_TIME_DEFAULTS[mealType];
        const reminderMinutes = target.hour * 60 + target.minute - 60;
        if (nowMinutes < reminderMinutes || nowMinutes >= reminderMinutes + 15) continue;

        const isNew = await markSentOnce(s.user_id, today, mealType);
        if (!isNew) continue;

        const { data: mealsToday } = await supabase
          .from("meals").select("title, status").eq("user_id", s.user_id).eq("date", today).eq("meal_type", mealType);
        let title = mealsToday?.find(m => m.status === "planned")?.title ?? mealsToday?.[0]?.title;
        if (!title) {
          title = scaleMealToTarget(pickMealForDate(MEAL_POOL[mealType as MealType], today), mealType as MealType, profile.cal_target ?? 2200).title;
        }

        try {
          await sendSms(profile.phone, `AI Food Coach: через час — ${MEAL_TYPE_LABELS[mealType]}: ${title}. Подробнее: ${appUrl}/today`);
          sentSms++;
        } catch (err) {
          failed++;
          details.push(`SMS за час (${mealType}) → ${profile.phone}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  return NextResponse.json({ sentSms, sentEmail, failed, details });
}
