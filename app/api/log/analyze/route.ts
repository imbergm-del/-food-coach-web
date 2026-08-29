import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { suggestJSON } from "@/lib/aiSuggest";
import { getLang } from "@/lib/language";

export const maxDuration = 30;

type Result = {
  title: string; ingredients: { name: string; qty: string }[];
  calories: number; protein: number; fat: number; carbs: number; error?: string;
};

export async function POST(req: Request) {
  const en = getLang() === "en";

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: en ? "Text parsing isn't set up yet: add ANTHROPIC_API_KEY to Vercel environment variables." : "Разбор текста ещё не настроен: добавьте ANTHROPIC_API_KEY в переменные окружения Vercel." },
      { status: 503 }
    );
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: en ? "Not authorized" : "Не авторизован" }, { status: 401 });

  const { text } = await req.json() as { text: string };
  if (!text?.trim()) return NextResponse.json({ error: en ? "Describe what you ate" : "Опишите, что съели" }, { status: 400 });

  const langLine = en ? "Respond in English (dish title, ingredient names, and the error field if used). " : "";
  const result = await suggestJSON<Result>(
    `${langLine}Ты — модуль распознавания еды по текстовому описанию в приложении AI Food Coach. Пользователь словами описывает, что съел. Определи состав и оцени КБЖУ по стандартным порциям. Отвечай СТРОГО валидным JSON-объектом без markdown, в точности в этом формате: {"title":"короткое название блюда/приёма", "ingredients":[{"name":"компонент","qty":"150 г"}], "calories":0, "protein":0, "fat":0, "carbs":0}. Числа — целые. Если описание не похоже на еду или пустое, верни {"error":"короткое объяснение"}.`,
    text.trim(),
    500
  );

  if (!result) {
    return NextResponse.json({ error: en ? "Couldn't parse the description. Try rephrasing it." : "Не получилось разобрать описание. Попробуйте переформулировать." }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json(result);
}
