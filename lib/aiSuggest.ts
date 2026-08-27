import Anthropic from "@anthropic-ai/sdk";

// Если ответ модели обрезался посреди JSON-массива (не хватило max_tokens),
// вытаскиваем все полностью пришедшие объекты верхнего уровня вместо того,
// чтобы терять всю подборку из-за одного недописанного элемента в хвосте.
function salvagePartialArray(raw: string): unknown[] | null {
  if (!raw.trim().startsWith("[")) return null;
  const items: unknown[] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        try {
          items.push(JSON.parse(raw.slice(start, i + 1)));
        } catch {
          // хвостовой объект тоже обрезан — пропускаем его, остальное уже спасли
        }
        start = -1;
      }
    }
  }
  return items.length ? items : null;
}

// Generic helper for server components that need a structured (JSON) suggestion
// from the model. Returns null if unconfigured or on any failure — callers show
// a fallback message instead of crashing the page. Retries once on failure/timeout,
// since a single dropped request otherwise means an empty screen.
export async function suggestJSON<T>(
  systemPrompt: string, userPrompt: string, maxTokens = 500
): Promise<T | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const attempt = async () => {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text)
      .join("\n")
      .trim();

    const match = text.match(/[[{][\s\S]*[\]}]/) ?? text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found in model response");
    try {
      return JSON.parse(match[0]) as T;
    } catch (parseErr) {
      const salvaged = salvagePartialArray(match[0]);
      if (salvaged) return salvaged as T;
      throw parseErr;
    }
  };

  try {
    return await attempt();
  } catch (err) {
    console.error("AI suggest error (attempt 1):", err);
    try {
      return await attempt();
    } catch (err2) {
      console.error("AI suggest error (attempt 2):", err2);
      return null;
    }
  }
}
