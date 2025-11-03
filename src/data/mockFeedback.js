// src/data/mockFeedback.js
// Sample NLP-style feedback data for AI Coach

// Feedback categories based on player behavior and market conditions
export const FEEDBACK_TYPES = {
  PANIC_SELLING: "panic_selling",
  OVER_CONCENTRATION: "over_concentration", 
  GOOD_DIVERSIFICATION: "good_diversification",
  MISSED_OPPORTUNITY: "missed_opportunity",
  AGGRESSIVE_BUYING: "aggressive_buying",
  PASSIVE_RESPONSE: "passive_response",
  BLACK_SWAN_RESPONSE: "black_swan_response",
  PROFIT_TAKING: "profit_taking",
  RATE_SHOCK: "rate_shock",
  EARNINGS_MOVE: "earnings_move"
};

// Serious mode feedback (professional, analytical)
export const seriousFeedback = {
  [FEEDBACK_TYPES.PANIC_SELLING]: [
    "Detected panic selling behavior. Studies show that reactive selling during market volatility often underperforms holding strategies. Consider setting stop-loss orders proactively.",
    "Rapid position reduction during negative events correlates with lower long-term returns. Evaluate whether your exit strategy aligns with your risk tolerance.",
    "Volatility-driven exits can lock in losses. Consider rebalancing rather than liquidation during market stress."
  ],
  [FEEDBACK_TYPES.OVER_CONCENTRATION]: [
    "Portfolio concentration risk detected. Your holdings are heavily weighted in a single sector. Diversification across sectors reduces correlation risk.",
    "High single-sector exposure increases vulnerability to sector-specific shocks. Consider allocating across multiple industry groups.",
    "Concentration in {sector} exceeds recommended thresholds. Spreading risk across 4-6 sectors typically improves risk-adjusted returns."
  ],
  [FEEDBACK_TYPES.GOOD_DIVERSIFICATION]: [
    "Well-diversified portfolio positioning. Your sector allocation shows good risk distribution across market segments.",
    "Portfolio demonstrates effective diversification. This structure helps mitigate event-driven volatility.",
    "Balanced sector allocation detected. Maintain this approach to reduce idiosyncratic risk exposure."
  ],
  [FEEDBACK_TYPES.MISSED_OPPORTUNITY]: [
    "Potential missed opportunity: Positive market signal ({eventType}) occurred without position adjustment. Consider proactive portfolio rebalancing.",
    "Market event ({eventType}) presented favorable conditions, but no trades were executed. Active management during news events can enhance returns.",
    "Event-driven opportunity identified but not acted upon. Develop systematic responses to recurring market patterns."
  ],
  [FEEDBACK_TYPES.AGGRESSIVE_BUYING]: [
    "Aggressive buying detected during positive momentum. Be cautious of momentum chasing - prices may already reflect recent news.",
    "High buying activity following positive events can lead to overconcentration. Scale into positions gradually.",
    "Consider value-at-risk when adding positions during rallies. Ensure new positions don't exceed risk limits."
  ],
  [FEEDBACK_TYPES.PASSIVE_RESPONSE]: [
    "Passive response to market event. While inactivity can be strategic, regular portfolio review helps maintain alignment with goals.",
    "No portfolio changes during significant event. Consider whether your current allocation matches your risk-return objectives.",
    "Monitor portfolio drift during extended inactivity. Periodic rebalancing maintains target allocations."
  ],
  [FEEDBACK_TYPES.BLACK_SWAN_RESPONSE]: [
    "Black swan event requires defensive positioning. Consider reducing leverage and increasing cash reserves.",
    "Extreme market stress detected. Portfolio resilience depends on diversification and position sizing.",
    "Rare event impact assessed. Historical data suggests maintaining core positions while trimming risk can preserve capital."
  ],
  [FEEDBACK_TYPES.PROFIT_TAKING]: [
    "Profit-taking observed. Systematic profit harvesting can lock in gains while maintaining core positions.",
    "Consider trailing stops to protect profits while allowing positions to run during favorable trends.",
    "Partial profit realization is prudent. Rebalance to maintain target allocation percentages."
  ],
  [FEEDBACK_TYPES.RATE_SHOCK]: [
    "Interest rate sensitivity noted. High-beta and growth stocks typically underperform during rate hikes. Consider defensive rotation.",
    "Rate shock impacts fixed-income proxies and high-growth sectors disproportionately. Rebalance toward value sectors.",
    "Fed policy changes require portfolio adjustment. Financials may benefit while tech faces headwinds."
  ],
  [FEEDBACK_TYPES.EARNINGS_MOVE]: [
    "Earnings-driven volatility presents trading opportunities. Monitor guidance changes and sector implications.",
    "Company-specific news requires evaluation of broader sector trends. Don't overweight single-stock moves.",
    "Earnings beats can drive momentum. Consider position sizing based on conviction level and risk management."
  ]
};

// Playful mode feedback (casual, engaging, less formal)
export const playfulFeedback = {
  [FEEDBACK_TYPES.PANIC_SELLING]: [
    "Whoa there, speed trader! 😅 Panic selling is like throwing all your chips away when the table gets hot. Take a breath and think strategy, not survival mode.",
    "Hold up! That's a classic 'sell the news' move, but maybe a bit too classic? Try diversification instead of the nuclear option.",
    "Panic mode activated? 🚨 Remember: the best traders make moves based on logic, not fear. Consider trimming, not nuking, your positions."
  ],
  [FEEDBACK_TYPES.OVER_CONCENTRATION]: [
    "All your eggs in one basket? 🥚🧺 You're betting big on {sector} - that's either genius or... not. Try spreading the love across sectors!",
    "Diversification is your friend! Right now you're riding one horse - what if that horse trips? Mix it up a bit! 🐎",
    "Hey, I see you really love {sector}! But putting everything in one place is risky. How about a nice portfolio salad with different ingredients? 🥗"
  ],
  [FEEDBACK_TYPES.GOOD_DIVERSIFICATION]: [
    "Nice! Your portfolio looks like a well-balanced meal - not too much of one thing. Keep that energy! 🎯",
    "You're playing it smart with diversification! This is how pros do it - spreading risk like butter on toast. 🍞✨",
    "Portfolio check: ✅ You've got variety! That's the secret sauce for handling market surprises."
  ],
  [FEEDBACK_TYPES.MISSED_OPPORTUNITY]: [
    "Hey, did you see that {eventType} event? It was waving at you, but you didn't wave back! 😉 Sometimes opportunity knocks - answer the door next time!",
    "That {eventType} was like a gift that you left unopened. Don't be shy - market events are invitations to make moves! 🎁",
    "Missed connection: Market event wants to meet you! {eventType} happened but no trades? That's okay, but maybe next time say hello!"
  ],
  [FEEDBACK_TYPES.AGGRESSIVE_BUYING]: [
    "Whoa, slow down there, tiger! 🐅 Buying everything that moves is exciting, but remember: even bulls need rest. Pace yourself!",
    "FOMO mode: ACTIVATED! 💸 I see you're buying the rally - just make sure you're not buying at the top. Spread those buys out!",
    "Easy there, big spender! Buying during rallies is fine, but don't go all-in on FOMO. Your future self will thank you for discipline."
  ],
  [FEEDBACK_TYPES.PASSIVE_RESPONSE]: [
    "Are you still there? 👀 The market moved and you... didn't? That's okay sometimes, but make sure you're not sleep-trading!",
    "Playing it cool, I see! 😎 Sometimes doing nothing is the right move, but make sure your portfolio isn't drifting. Check those positions!",
    "Watching paint dry? Because that's what your portfolio is doing! 🎨 Jokes aside, sometimes patience pays, but stay engaged!"
  ],
  [FEEDBACK_TYPES.BLACK_SWAN_RESPONSE]: [
    "Yikes! A black swan just crashed the party! 🦢⚫ Time to batten down the hatches and maybe keep some cash ready. Don't panic, but do protect yourself!",
    "Who invited the black swan? 😱 These rare events need special handling - think defense, not offense. Safety first!",
    "Plot twist: Black swan appears! 🎭 These are the moments that test traders. Stay calm, protect capital, and live to trade another day!"
  ],
  [FEEDBACK_TYPES.PROFIT_TAKING]: [
    "Cha-ching! 💰 Taking profits is smart! But remember, letting winners run (with protection) can be even smarter. Balance is key!",
    "Profit secured! 🎉 Nice work locking in gains. Now the question is: let the rest ride or cash out completely? Your call, but consider partial exits!",
    "Taking money off the table? That's what winners do! 💵 Just make sure you're not leaving too much opportunity on the table either."
  ],
  [FEEDBACK_TYPES.RATE_SHOCK]: [
    "Interest rates just did a thing! 📈💸 When rates jump, growth stocks often take a nap. Time to rotate or hold tight?",
    "Fed says: 'Surprise!' 🏦 High-growth stocks don't love rate hikes. Maybe mix in some value players?",
    "Rate hike incoming! 🚨 Tech and growth usually feel the squeeze. Consider whether it's time to shuffle the deck a bit."
  ],
  [FEEDBACK_TYPES.EARNINGS_MOVE]: [
    "Earnings season = drama season! 📊 That {eventType} made some noise. The question is: did you dance with it or just watch?",
    "Earnings surprise! 🎲 Company news can move markets. Don't forget to check if the whole sector got the memo.",
    "Earnings beat or miss? Either way, it's moving! 💥 Remember: one stock's news can hint at broader trends. Stay curious!"
  ]
};

/**
 * Generate personalized feedback based on event, player action, and portfolio state
 * @param {Object} params
 * @param {Object} params.lastEvent - The most recent market event
 * @param {Object} params.playerAction - Player's trading behavior (e.g., "panic_sell", "bought_aggressively", "no_action")
 * @param {Object} params.portfolio - Current portfolio state
 * @param {number} params.totalPnL - Total profit/loss
 * @param {string} params.mode - "serious" or "playful"
 * @returns {Array<string>} Array of 2-3 feedback tips
 */
export function generateFeedback({ lastEvent, playerAction, portfolio, totalPnL, mode = "serious" }) {
  const feedbackPool = mode === "playful" ? playfulFeedback : seriousFeedback;
  const tips = [];
  
  // Analyze portfolio concentration
  const sectorCounts = {};
  portfolio.forEach(holding => {
    const sector = holding.sector || "Unknown";
    sectorCounts[sector] = (sectorCounts[sector] || 0) + (holding.shares * holding.price);
  });
  const dominantSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0];
  const totalValue = Object.values(sectorCounts).reduce((sum, val) => sum + val, 0);
  const concentrationRatio = dominantSector ? (dominantSector[1] / totalValue) : 0;

  // Determine feedback type based on player action and context
  let feedbackType;
  
  if (playerAction === "panic_sell" || (playerAction === "sold" && totalPnL < -500)) {
    feedbackType = FEEDBACK_TYPES.PANIC_SELLING;
  } else if (concentrationRatio > 0.5) {
    feedbackType = FEEDBACK_TYPES.OVER_CONCENTRATION;
  } else if (concentrationRatio < 0.3 && portfolio.length > 5) {
    feedbackType = FEEDBACK_TYPES.GOOD_DIVERSIFICATION;
  } else if (playerAction === "no_action" && lastEvent && lastEvent.impactPct > 0.01) {
    feedbackType = FEEDBACK_TYPES.MISSED_OPPORTUNITY;
  } else if (playerAction === "bought_aggressively" || playerAction === "bought_multiple") {
    feedbackType = FEEDBACK_TYPES.AGGRESSIVE_BUYING;
  } else if (playerAction === "no_action") {
    feedbackType = FEEDBACK_TYPES.PASSIVE_RESPONSE;
  } else if (lastEvent && lastEvent.type === "BLACKSWAN") {
    feedbackType = FEEDBACK_TYPES.BLACK_SWAN_RESPONSE;
  } else if (playerAction === "sold" && totalPnL > 0) {
    feedbackType = FEEDBACK_TYPES.PROFIT_TAKING;
  } else if (lastEvent && (lastEvent.type === "MACRO" && lastEvent.title?.toLowerCase().includes("rate"))) {
    feedbackType = FEEDBACK_TYPES.RATE_SHOCK;
  } else if (lastEvent && lastEvent.type === "MICRO") {
    feedbackType = FEEDBACK_TYPES.EARNINGS_MOVE;
  } else {
    feedbackType = FEEDBACK_TYPES.PASSIVE_RESPONSE;
  }

  // Get feedback options for this type
  const options = feedbackPool[feedbackType] || feedbackPool[FEEDBACK_TYPES.PASSIVE_RESPONSE];
  
  // Select 2-3 tips
  const selectedTips = [];
  const shuffled = [...options].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(3, shuffled.length); i++) {
    let tip = shuffled[i];
    
    // Replace placeholders
    if (dominantSector && tip.includes("{sector}")) {
      tip = tip.replace("{sector}", dominantSector[0]);
    }
    if (lastEvent && tip.includes("{eventType}")) {
      tip = tip.replace("{eventType}", lastEvent.type || "Event");
    }
    
    selectedTips.push(tip);
  }
  
  return selectedTips;
}

/**
 * Generate event summary for AI Coach Panel
 * @param {Object} event - Market event object
 * @param {number} totalPnL - Current portfolio P/L
 * @returns {string} Summary text
 */
export function generateEventSummary(event, totalPnL) {
  if (!event) {
    return "Waiting for market signals...";
  }
  
  const impact = event.impactPct || 0;
  const impactText = impact >= 0 ? `+${(impact * 100).toFixed(1)}%` : `${(impact * 100).toFixed(1)}%`;
  const pnlText = totalPnL >= 0 ? `+$${totalPnL.toFixed(2)}` : `-$${Math.abs(totalPnL).toFixed(2)}`;
  
  return `${event.type} event: ${event.title || "Market movement"}. Impact: ${impactText}. Your P/L: ${pnlText}`;
}
