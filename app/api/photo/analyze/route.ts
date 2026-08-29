import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabaseServer";
import { getLang } from "@/lib/language";

export const maxDuration = 30;

function systemPrompt(en: boolean) {
  const langLine = en ? "Respond in English (dish title, component names, and the error field if used). " : "";
  return `${langLine}Ты — модуль распознавания еды по фото в приложении AI Food Coach.
Посмотри на фото и определи, что за блюдо и из чего оно состоит. Оцени вес каждого компонента на глаз и посчитай КБЖУ ОТДЕЛЬНО ДЛЯ КАЖДОГО компонента (не только общую сумму) — это нужно, чтобы пользователь мог убрать из списка компонент, которого на самом деле нет на тарелке или который он не съел, и итог пересчитался автоматически.

Отвечай СТРОГО валидным JSON без markdown-разметки, без пояснений до или после — ничего, кроме самого JSON, в точности такого формата:
{"title": "Короткое название блюда", "ingredients": [{"name": "Компонент", "qty": "180 г", "calories": 000, "protein": 00, "fat": 00, "carbs": 00}]}

Числа — целые. Сумма КБЖУ по компонентам должна давать реалистичный итог для всего блюда. Если на фото не еда или распознать невозможно, верни {"error": "короткое объяснение"}.`;
}

export async function POST(req: Request) {
  const lang = getLang();
  const en = lang === "en";

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: en ? "Photo recognition isn't set up yet: add ANTHROPIC_API_KEY to Vercel environment variables." : "Распознавание фото ещё не настроено: добавьте ANTHROPIC_API_KEY в переменные окружения Vercel." },
      { status: 503 }
    );
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: en ? "Not authorized" : "Не авторизован" }, { status: 401 });

  const { imageBase64, mediaType } = await req.json() as { imageBase64: string; mediaType: string };
  if (!imageBase64) return NextResponse.json({ error: en ? "No photo received" : "Фото не получено" }, { status: 400 });

  const allowedMediaTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
  type AllowedMediaType = (typeof allowedMediaTypes)[number];
  if (!allowedMediaTypes.includes(mediaType as AllowedMediaType)) {
    return NextResponse.json({ error: en ? "Unsupported photo format" : "Неподдерживаемый формат фото" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      system: systemPrompt(en),
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType as AllowedMediaType, data: imageBase64 } },
          { type: "text", text: "Определи блюдо на фото и оцени его КБЖУ." }
        ]
      }]
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map(block => block.text)
      .join("\n")
      .trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 422 });

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Photo analyze error:", err);
    return NextResponse.json({ error: en ? "Couldn't recognize the photo. Try a different angle or retake it." : "Не получилось распознать фото. Попробуйте другой ракурс или снимите заново." }, { status: 502 });
  }
}
