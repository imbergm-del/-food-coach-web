import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabaseServer";
import { DINNER_PROTEINS, DINNER_FATS } from "@/lib/mealTypes";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

const SYSTEM_PROMPT = `Ты помогаешь спланировать питание на завтра по фото содержимого холодильника или кухонного шкафа.
Посмотри на фото и предложи короткий план на завтра из того, что реально видно (плюс базовые вещи вроде соли, масла, круп — считай, что они обычно есть дома).

Отвечай СТРОГО валидным JSON без markdown, без пояснений, в точности в этом формате:
{"breakfastIdea": "короткая идея завтрака из увиденного, 3-6 слов", "lunchIdea": "короткая идея обеда из увиденного, 3-6 слов", "dinnerProtein": "meat" | "fish" | "chicken", "dinnerFat": "olive_oil" | "avocado"}

dinnerProtein — выбери то, что ближе всего к видимому на фото мясу/рыбе/курице (если ничего похожего не видно — выбери chicken).
dinnerFat — avocado, если на фото есть авокадо, иначе olive_oil.
Если на фото совсем не еда — верни {"error": "короткое объяснение по-русски"}.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Подсказки по фото ещё не настроены: добавьте ANTHROPIC_API_KEY в переменные окружения Vercel." },
      { status: 503 }
    );
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { imageBase64, mediaType } = await req.json() as { imageBase64: string; mediaType: string };
  if (!imageBase64 || !ALLOWED_IMAGE_TYPES.includes(mediaType as AllowedImageType)) {
    return NextResponse.json({ error: "Фото не получено или формат не поддерживается" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType as AllowedImageType, data: imageBase64 } },
          { type: "text", text: "Что у меня есть на фото? Предложи план на завтра." }
        ]
      }]
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text)
      .join("\n")
      .trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 422 });
    if (!(parsed.dinnerProtein in DINNER_PROTEINS)) parsed.dinnerProtein = "chicken";
    if (!(parsed.dinnerFat in DINNER_FATS)) parsed.dinnerFat = "olive_oil";

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Plan-from-photo error:", err);
    return NextResponse.json({ error: "Не получилось разобрать фото. Попробуйте другой ракурс." }, { status: 502 });
  }
}
