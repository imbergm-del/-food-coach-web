import Anthropic from "@anthropic-ai/sdk";

// Generic helper for server components that need a structured (JSON) suggestion
// from the model. Returns null if unconfigured or on any failure — callers show
// a fallback message instead of crashing the page. Uses Haiku (fast + cheap) since
// these are short, well-specified extraction tasks, not open-ended conversation —
// and retries once on failure/timeout, since a single dropped request otherwise
// means an empty screen.
export async function suggestJSON<T>(
  systemPrompt: string, userPrompt: string, maxTokens = 500
): Promise<T | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const attempt = async () => {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
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
    return JSON.parse(match[0]) as T;
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
