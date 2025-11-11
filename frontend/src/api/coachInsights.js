const HF_DEFAULT_MODEL =
  "https://api-inference.huggingface.co/models/google/flan-t5-large";

async function requestJson(url, options, controller) {
  const response = await fetch(url, { ...options, signal: controller.signal });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Coach API error (${response.status}): ${
        text || response.statusText || "Unknown error"
      }`
    );
  }
  return response.json();
}

export async function fetchCoachInsights({
  eventSummary,
  playerAction,
  portfolioSnapshot,
  pnl,
  mode = "serious",
  apiKey,
  controller,
}) {
  if (!apiKey) {
    throw new Error("Missing VITE_HF_API_KEY");
  }

  const modelUrl =
    import.meta.env.VITE_HF_COACH_MODEL_URL?.trim() || HF_DEFAULT_MODEL;

  const style =
    mode === "playful"
      ? "Keep the tone casual and encouraging with light emojis."
      : "Keep the tone concise, professional, and actionable.";

  const prompt = `
You are an AI trading coach. Analyze the player behavior and provide 3 short, numbered coaching tips.

Event summary: ${eventSummary || "No current event"}
Player action analysis: ${playerAction}
Portfolio snapshot: ${portfolioSnapshot}
Current P/L: ${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)}

${style}
Each tip must be at most 20 words. Respond as:
1. ...
2. ...
3. ...
`.trim();

  const body = {
    inputs: prompt,
    parameters: {
      max_new_tokens: 180,
      temperature: mode === "playful" ? 0.85 : 0.55,
      return_full_text: false,
    },
  };

  const json = await requestJson(
    modelUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    },
    controller
  );

  const rawText = Array.isArray(json)
    ? json[0]?.generated_text || json[0]?.generated_text?.trim?.()
    : json.generated_text || json?.choices?.[0]?.text;

  if (!rawText) {
    throw new Error("Coach API returned an empty response");
  }

  return rawText
    .split(/\n+/)
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

export default fetchCoachInsights;

