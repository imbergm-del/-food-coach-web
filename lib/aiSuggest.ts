import Anthropic from "@anthropic-ai/sdk";

// Generic helper for server components that need a structured (JSON) suggestion
// from the model. Returns null if unconfigured or on any failure — callers show
// a fallback message instead of crashing the page.
export async function suggestJSON<T>(systemPrompt: string, userPrompt: string): Promise<T | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 700,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text)
      .join("\n")
      .trim();

    const match = text.match(/[[{][\s\S]*[\]}]/) ?? text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as T;
  } catch (err) {
    console.error("AI suggest error:", err);
    return null;
  }
}
