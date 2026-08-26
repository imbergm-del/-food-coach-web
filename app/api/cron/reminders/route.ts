import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

// Triggered daily by Vercel Cron (see vercel.json). Vercel signs cron requests
// with this header when CRON_SECRET is set, so we can trust the caller.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: "RESEND_API_KEY не настроен — напоминания не отправлены." });
  }

  const supabase = createAdminClient();
  const { data: settings, error } = await supabase
    .from("reminder_settings").select("user_id").eq("enabled", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!settings?.length) return NextResponse.json({ sent: 0 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://food-coach-web.vercel.app";
  let sent = 0;
  let failed = 0;

  for (const s of settings) {
    const { data: userData } = await supabase.auth.admin.getUserById(s.user_id);
    const email = userData?.user?.email;
    if (!email) { failed++; continue; }

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
          html: `<p>Загляните в приложение, чтобы посмотреть план на завтра и остаток КБЖУ.</p><p><a href="${appUrl}/reminders">Открыть напоминание</a></p>`
        })
      });
      if (res.ok) sent++; else failed++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed });
}
