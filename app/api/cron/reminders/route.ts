import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { MEAL_TYPE_LABELS } from "@/lib/mealTypes";

// Triggered daily by Vercel Cron (see vercel.json), which sends the secret as a
// Bearer header. A "?secret=" query param is also accepted so this can be
// triggered manually from a browser for testing.
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
  const { data: settings, error } = await supabase
    .from("reminder_settings").select("user_id").eq("enabled", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!settings?.length) return NextResponse.json({ sent: 0, note: "Нет пользователей с включёнными напоминаниями (reminder_settings.enabled = true)." });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://food-coach-web.vercel.app";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().slice(0, 10);

  let sentSms = 0, sentEmail = 0, failed = 0;
  const details: string[] = [];

  for (const s of settings) {
    const { data: profile } = await supabase.from("profiles").select("phone, email").eq("id", s.user_id).single();
    const { data: plannedMeals } = await supabase
      .from("meals").select("meal_type, title").eq("user_id", s.user_id).eq("date", tomorrowISO);

    const planLines = (plannedMeals ?? []).map(
      m => `${MEAL_TYPE_LABELS[m.meal_type as keyof typeof MEAL_TYPE_LABELS] ?? m.meal_type}: ${m.title}`
    );
    const planSummary = planLines.length ? planLines.join("; ") : "план на завтра ещё не составлен — откройте приложение";

    if (smsConfigured && profile?.phone) {
      try {
        const body = new URLSearchParams({
          To: profile.phone,
          From: process.env.TWILIO_FROM_NUMBER!,
          Body: `AI Food Coach: ваше питание на завтра — ${planSummary}. Подробнее: ${appUrl}/reminders`
        });
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body
          }
        );
        if (res.ok) { sentSms++; continue; }
        failed++;
        details.push(`SMS → ${profile.phone}: ${res.status} ${await res.text()}`);
        continue;
      } catch (err) {
        failed++;
        details.push(`SMS → ${profile.phone}: ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }
    }

    if (emailConfigured) {
      const email = profile?.email;
      if (!email) { failed++; details.push(`Email: у пользователя ${s.user_id} нет email в profiles`); continue; }

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: process.env.REMINDER_FROM_EMAIL ?? "AI Food Coach <onboarding@resend.dev>",
            to: email,
            subject: "Ваше питание на завтра готово",
            html: `<p>${planSummary}</p><p><a href="${appUrl}/reminders">Открыть напоминание</a></p>`
          })
        });
        if (res.ok) { sentEmail++; continue; }
        failed++;
        details.push(`Email → ${email}: ${res.status} ${await res.text()}`);
      } catch (err) {
        failed++;
        details.push(`Email → ${email}: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      failed++;
      details.push(`Пользователь ${s.user_id}: нет телефона и email-канал не настроен`);
    }
  }

  return NextResponse.json({ sentSms, sentEmail, failed, details });
}
