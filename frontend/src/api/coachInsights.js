// OpenRouter API configuration
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini"; // Fast and cost-effective model

async function requestJson(url, options, controller) {
  const response = await fetch(url, { 
    ...options, 
    signal: controller.signal,
    credentials: 'omit' // Don't send cookies to avoid OpenRouter cookie auth error
  });
  if (!response.ok) {
    const text = await response.text();
    let errorMessage = `Coach API error (${response.status}): ${text || response.statusText || "Unknown error"}`;
    try {
      const errorJson = JSON.parse(text);
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message;
      } else if (errorJson.error?.code) {
        errorMessage = `${errorJson.error.code}: ${errorJson.error.message || text}`;
      }
    } catch (e) {
      // Use default error message
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

/**
 * Fetch AI coaching insights from OpenRouter
 * @param {Object} params
 * @param {string} params.eventSummary - Summary of market events
 * @param {string} params.playerAction - Player's trading behavior
 * @param {string} params.portfolioSnapshot - Current portfolio state
 * @param {number} params.pnl - Current profit/loss
 * @param {string} params.mode - "serious" or "playful"
 * @param {string} params.apiKey - OpenRouter API key
 * @param {AbortController} params.controller - Abort controller for cancellation
 * @param {Object} params.roundData - Optional round-specific data for post-round analysis
 * @returns {Promise<Object>} Object with tips array and investmentStyle
 */
export async function fetchCoachInsights({
  eventSummary,
  playerAction,
  portfolioSnapshot,
  pnl,
  mode = "serious",
  apiKey,
  controller,
  roundData = null, // { roundNumber, tradesThisRound, eventsThisRound, roundPnL }
}) {
  if (!apiKey || !apiKey.trim()) {
    console.error("AI Coach: Missing API key");
    throw new Error("Missing VITE_OPENROUTER_API_KEY. Please set your OpenRouter API key in environment variables.");
  }
  
  console.log("AI Coach: Making request to OpenRouter with API key:", apiKey.substring(0, 10) + "...");

  const model = import.meta.env.VITE_OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;

  const isPostRound = !!roundData;
  const style =
    mode === "playful"
      ? "Keep the tone casual, encouraging, and engaging with light emojis. Be conversational but insightful."
      : "Keep the tone concise, professional, and actionable. Use financial terminology appropriately.";

  // Build comprehensive prompt with news comprehension analysis
  const isGameEnd = roundData?.isGameEnd;
  const eventReactions = roundData?.eventReactions || [];
  
  // Build detailed news analysis section
  let newsAnalysisSection = "";
  if (eventReactions.length > 0) {
    const reactionsText = eventReactions.map((r, idx) => {
      const event = r.event || r;
      const reactionStatus = r.reacted 
        ? (r.correctReaction === true ? "✅ Correctly reacted" : r.correctReaction === false ? "❌ Incorrect reaction" : "⚠️ Reacted but unclear")
        : "⏭️ No reaction";
      const reactionTime = r.reactionTimeMs ? ` (${(r.reactionTimeMs / 1000).toFixed(1)}s after event)` : "";
      return `${idx + 1}. ${event.type} event: "${event.title}" (${(event.impactPct * 100).toFixed(1)}% impact) - ${reactionStatus}${reactionTime}`;
    }).join("\n");
    
    newsAnalysisSection = `\n\nNEWS COMPREHENSION ANALYSIS:
${reactionsText}
${roundData?.newsComprehensionScore !== undefined ? `\nOverall News Comprehension Score: ${(roundData.newsComprehensionScore * 100).toFixed(0)}% (${roundData.correctReactions || 0} correct reactions out of ${roundData.totalReactions || 0} total reactions)` : ""}`;
  }

  // Build detailed trading pattern analysis
  let tradingPatternAnalysis = "";
  if (roundData?.eventReactions && roundData.eventReactions.length > 0) {
    const reactions = roundData.eventReactions;
    const correctReactions = reactions.filter(r => r.reacted && r.correctReaction === true).length;
    const incorrectReactions = reactions.filter(r => r.reacted && r.correctReaction === false).length;
    const missedEvents = reactions.filter(r => !r.reacted).length;
    const avgReactionTime = reactions
      .filter(r => r.reactionTimeMs !== null)
      .map(r => r.reactionTimeMs)
      .reduce((sum, time, idx, arr) => sum + (time / arr.length), 0);
    
    tradingPatternAnalysis = `\n\nDETAILED TRADING PATTERN ANALYSIS:
- Correct reactions: ${correctReactions} (${reactions.length > 0 ? ((correctReactions / reactions.length) * 100).toFixed(0) : 0}% accuracy)
- Incorrect reactions: ${incorrectReactions}
- Missed opportunities: ${missedEvents} events not reacted to
${avgReactionTime > 0 ? `- Average reaction time: ${(avgReactionTime / 1000).toFixed(1)} seconds` : "- No reactions timed"}
- Reaction patterns: ${correctReactions > incorrectReactions ? "Generally correct reactions" : incorrectReactions > correctReactions ? "Many incorrect reactions - needs improvement" : "Mixed performance"}`;
    
    // Add specific examples of reactions
    if (reactions.length > 0) {
      const exampleReactions = reactions.slice(0, 3).map((r, idx) => {
        const event = r.event || r;
        const reactionDesc = r.reacted 
          ? (r.correctReaction === true ? "✅ Correctly reacted" : r.correctReaction === false ? "❌ Reacted incorrectly" : "⚠️ Unclear reaction")
          : "⏭️ No reaction";
        return `  ${idx + 1}. "${event.title}" (${(event.impactPct * 100).toFixed(1)}% ${event.impactPct > 0 ? "positive" : "negative"}) - ${reactionDesc}${r.reactionTimeMs ? ` in ${(r.reactionTimeMs / 1000).toFixed(1)}s` : ""}`;
      }).join("\n");
      tradingPatternAnalysis += `\n\nSpecific examples:\n${exampleReactions}`;
    }
  }

  // Build detailed trade history section
  let tradeHistorySection = "";
  if (roundData?.tradeHistory && roundData.tradeHistory.length > 0) {
    const trades = roundData.tradeHistory;
    const buyTrades = trades.filter(t => t.action === "BUY");
    const sellTrades = trades.filter(t => t.action === "SELL");
    
    tradeHistorySection = `\n\nDETAILED TRADE HISTORY:
Total Trades: ${trades.length} (${buyTrades.length} buys, ${sellTrades.length} sells)

Trade Sequence:
${trades.map((t, idx) => {
      const eventInfo = t.relatedEvent 
        ? `Reacted to: "${t.relatedEvent.title}" (${t.relatedEvent.type}, ${(t.relatedEvent.impactPct * 100).toFixed(1)}% impact) - Reaction time: ${t.reactionTime ? (t.reactionTime / 1000).toFixed(1) + "s" : "N/A"}`
        : "No related event (independent trade)";
      return `${idx + 1}. ${t.action} ${t.quantity} shares of ${t.ticker} @ $${t.price.toFixed(2)} - ${eventInfo}`;
    }).join("\n")}`;
  }

  let prompt = `You are an expert AI trading coach analyzing a player's trading behavior in a simulated stock market game. Your focus is on providing PERSONALIZED, ACTIONABLE feedback based on their ACTUAL gameplay patterns.

CONTEXT:
${isGameEnd ? `The entire game has just completed (${roundData.totalRounds || 0} rounds total).` : isPostRound ? `Round ${roundData.roundNumber} has just completed.` : "Player is currently in an active trading round."}

MARKET EVENTS:
${eventSummary || "No recent events"}
${roundData?.eventsInRound ? `\nEvents this ${isGameEnd ? 'game' : 'round'}: ${roundData.eventsInRound.map(e => `"${e.title}" (${e.type}, ${(e.impactPct * 100).toFixed(1)}% impact)`).join(", ")}` : ""}${tradeHistorySection}${tradingPatternAnalysis}

PLAYER BEHAVIOR ANALYSIS:
${playerAction}
${roundData ? `\nTrades this ${isGameEnd ? 'game' : 'round'}: ${roundData.tradesThisRound || roundData.totalTrades || 0}` : ""}
${roundData?.eventReactions ? `\nNews comprehension score: ${roundData.newsComprehensionScore !== undefined ? (roundData.newsComprehensionScore * 100).toFixed(0) + "%" : "N/A"} (${roundData.correctReactions || 0} correct out of ${roundData.totalReactions || 0} reactions)` : ""}

PORTFOLIO STATE:
${portfolioSnapshot}

PERFORMANCE METRICS:
Current P/L: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}
${roundData ? `${isGameEnd ? 'Final' : 'Round'} P/L: ${(roundData.finalPnL !== undefined ? roundData.finalPnL : roundData.roundPnL) >= 0 ? "+" : ""}$${Math.abs(roundData.finalPnL !== undefined ? roundData.finalPnL : roundData.roundPnL).toFixed(2)}` : ""}${newsAnalysisSection}

${style}

CRITICAL: Provide PERSONALIZED feedback based on their ACTUAL gameplay. Reference specific events, reactions, and patterns from the data above. Do NOT give generic advice.

ANALYSIS REQUIRED:
1. PERSONALIZED Investment Style Analysis:
   - Analyze their ACTUAL trading patterns from the data above
   - Determine if they are: Conservative (rarely trades, waits for confirmation), Moderate (balanced approach), Aggressive/Risky (trades frequently, takes risks), or Balanced
   - Base this on: reaction frequency, reaction correctness, trade volume, and risk-taking behavior
   - Provide a 1-sentence description that SPECIFICALLY references their behavior (e.g., "You showed a moderate approach by reacting to 60% of events correctly, but missed 3 key opportunities")

2. PERSONALIZED Strengths (2-3 specific strengths):
   - Reference ACTUAL examples from their ${isGameEnd ? 'game' : 'round'} performance
   - Examples: "You correctly reacted to the Fed rate hike within 2 seconds" or "You avoided panic selling during the market dip"
   - Be specific and reference actual events/trades

3. PERSONALIZED Areas to Improve (2-3 specific improvements):
   - Reference ACTUAL mistakes or missed opportunities from their ${isGameEnd ? 'game' : 'round'}
   - Examples: "You missed reacting to 3 negative MACRO events that caused losses" or "Your reaction time averaged 8 seconds - aim for under 5 seconds"
   - Be specific and actionable

4. PERSONALIZED Actionable Tips (3-4 tips):
   - Each tip MUST reference their actual performance
   - Examples: "You reacted incorrectly to 2 positive events - remember: positive news = buy, negative news = sell"
   - Examples: "You missed 4 events - try to monitor news more closely and react within 5 seconds"
   - Each tip should be 1-2 sentences, max 25 words
   - Focus on SPECIFIC changes they can make based on their actual mistakes/patterns

RESPONSE FORMAT (JSON):
{
  "investmentStyle": "Conservative" | "Moderate" | "Aggressive" | "Risky" | "Balanced",
  "styleDescription": "Brief 1-sentence description of their trading style",
  "tips": [
    "Tip 1 (specific and actionable)",
    "Tip 2 (specific and actionable)",
    "Tip 3 (specific and actionable)",
    "Tip 4 (optional, if post-round analysis)"
  ],
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Area to improve 1", "Area to improve 2"]
}

Respond ONLY with valid JSON, no additional text.`;

  const body = {
    model: model,
    messages: [
      {
        role: "system",
        content: "You are an expert trading coach. Always respond with valid JSON only, no markdown formatting, no code blocks.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: mode === "playful" ? 0.8 : 0.6,
    max_tokens: 800,
  };

  try {
    const json = await requestJson(
      OPENROUTER_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin || "https://hedge-trading-game.com",
          "X-Title": "Hedge Trading Game AI Coach",
        },
        body: JSON.stringify(body),
      },
      controller
    );

    // Extract content from OpenRouter response
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenRouter API returned an empty response");
    }

    // Parse JSON response (handle markdown code blocks if present)
    let parsedContent = content.trim();
    if (parsedContent.startsWith("```")) {
      parsedContent = parsedContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    }

    const result = JSON.parse(parsedContent);

    // Validate and format response
    if (!result.tips || !Array.isArray(result.tips)) {
      throw new Error("Invalid response format from AI coach");
    }

    return {
      tips: result.tips.slice(0, 4), // Max 4 tips
      investmentStyle: result.investmentStyle || "Moderate",
      styleDescription: result.styleDescription || "Balanced trading approach",
      strengths: result.strengths || [],
      improvements: result.improvements || [],
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }
    console.error("OpenRouter API error:", error);
    throw new Error(`AI Coach error: ${error.message}`);
  }
}

export default fetchCoachInsights;

