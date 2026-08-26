import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Коуч ещё не настроен: добавьте ANTHROPIC_API_KEY в переменные окружения Vercel." },
      { status: 503 }
    );
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { messages } = await req.json() as { messages: { role: "user" | "assistant"; content: string }[] };
  if (!messages?.length) return NextResponse.json({ error: "Пустое сообщение" }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const today = new Date().toISOString().slice(0, 10);
  const { data: todaysMeals } = await supabase
    .from("meals").select("*").eq("user_id", user.id).eq("date", today).in("status", ["eaten", "photo_logged"]);

  const usedProtein = todaysMeals?.reduce((s, m) => s + (m.protein ?? 0), 0) ?? 0;
  const usedFat = todaysMeals?.reduce((s, m) => s + (m.fat ?? 0), 0) ?? 0;
  const usedCarbs = todaysMeals?.reduce((s, m) => s + (m.carbs ?? 0), 0) ?? 0;
  const usedCals = usedProtein * 4 + usedFat * 9 + usedCarbs * 4;
  const calTarget = profile?.cal_target ?? 2200;

  const systemPrompt = `Ты — лаконичный ИИ-коуч по питанию в приложении AI Food Coach. Обращайся на "ты", отвечай коротко и по делу, без длинных вступлений. Отвечай обычным текстом без markdown-разметки — без звёздочек, решёток и других символов форматирования, интерфейс их не отображает.
Профиль пользователя: ${profile?.name ?? "пользователь"}, ${profile?.age ?? "?"} лет, ${profile?.weight_kg ?? "?"} кг, ${profile?.height_cm ?? "?"} см, тренировок в неделю: ${profile?.workouts_per_week ?? "?"}.
Дневная норма: ${calTarget} ккал, белок ${profile?.protein_target ?? "?"} г, жиры ${profile?.fat_target ?? "?"} г, углеводы ${profile?.carb_target ?? "?"} г.
Уже съедено сегодня: ${usedCals} ккал (белок ${usedProtein} г, жиры ${usedFat} г, углеводы ${usedCarbs} г).
Осталось на сегодня: ${Math.max(0, calTarget - usedCals)} ккал.
Пользователь ленивый и не хочет тратить время на готовку — давай простые советы и конкретные варианты еды, а не общие рекомендации.`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map(block => block.text)
      .join("\n");

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("Coach API error:", err);
    return NextResponse.json({ error: "Не получилось получить ответ от коуча. Попробуйте ещё раз." }, { status: 502 });
  }
}
