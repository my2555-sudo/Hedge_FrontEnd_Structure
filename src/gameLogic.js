// GameLogic.js - Enhanced Game Scoring and State Management

export const TITLES = [
  { minStreak: 0, title: "Novice Trader" },
  { minStreak: 3, title: "Market Strategist" },
  { minStreak: 5, title: "Senior Trader" },
  { minStreak: 8, title: "Portfolio Manager" },
  { minStreak: 12, title: "Market Veteran" },
  { minStreak: 15, title: "Trading Legend" }
];

export const GAME_DURATIONS = {
  SHORT: 300,
  MEDIUM: 600,
  LONG: 900
};

export const ROUND_DURATION = 30;

// Internal game state
let gameState = {
  playerName: "",
  portfolioValue: 10000,
  initialValue: 10000,
  streak: 0,
  score: 0,
  roundsCompleted: 0,
  title: TITLES[0].title,
  blackSwanOccurred: false,
  blackSwanType: null
};

// --- Game State Management ---

export function startGame(playerName, initialValue = 10000) {
  gameState = {
    playerName,
    portfolioValue: initialValue,
    initialValue,
    streak: 0,
    score: 0,
    roundsCompleted: 0,
    title: TITLES[0].title,
    blackSwanOccurred: false,
    blackSwanType: null
  };
  return { ...gameState };
}

export function getGameState() {
  return { ...gameState };
}

export function resetGame() {
  return startGame(gameState.playerName, gameState.initialValue);
}

// --- Title and Score Logic ---

export function calculateTitle(streak) {
  let currentTitle = TITLES[0].title;
  for (let i = TITLES.length - 1; i >= 0; i--) {
    if (streak >= TITLES[i].minStreak) {
      currentTitle = TITLES[i].title;
      break;
    }
  }
  return currentTitle;
}

export function calculateScore(portfolioValue, streak, initialValue = 10000, blackSwanMultiplier = 1) {
  const profitLossPercent = ((portfolioValue - initialValue) / initialValue) * 100;
  const streakBonus = streak * 50; // 50 points per survival streak
  const comboMultiplier = streak >= 5 ? 1.5 : 1; // bonus for long streaks
  const baseScore = Math.max(0, profitLossPercent * 10); // 10 pts per 1% gain
  return Math.round((baseScore + streakBonus) * comboMultiplier * blackSwanMultiplier);
}

// --- Round Logic ---

export function checkSurvival(portfolioValue, minThreshold = 0.2, initialValue = 10000) {
  const minimumValue = initialValue * minThreshold;
  return portfolioValue >= minimumValue;
}

/**
 * Apply results of a round
 * @param {Object} options
 *  - portfolioValue: number
 *  - blackSwanOccurred: boolean
 *  - blackSwanType: string
 */
export function applyRound({ portfolioValue, blackSwanOccurred = false, blackSwanType = null }) {
  gameState.roundsCompleted += 1;
  gameState.portfolioValue = portfolioValue;
  gameState.blackSwanOccurred = blackSwanOccurred;
  gameState.blackSwanType = blackSwanType;

  const survived = checkSurvival(portfolioValue, 0.2, gameState.initialValue);
  gameState.streak = survived ? gameState.streak + 1 : 0;

  const blackSwanMultiplier = blackSwanOccurred ? 0.8 : 1; // penalty if black swan occurs
  gameState.score = calculateScore(portfolioValue, gameState.streak, gameState.initialValue, blackSwanMultiplier);
  gameState.title = calculateTitle(gameState.streak);

  return { ...gameState, survived };
}

// --- Leaderboard ---

export function createLeaderboardEntry() {
  return {
    playerName: gameState.playerName,
    score: gameState.score,
    streak: gameState.streak,
    title: gameState.title,
    portfolioValue: gameState.portfolioValue,
    roundsCompleted: gameState.roundsCompleted,
    timestamp: Date.now()
  };
}

export function sortLeaderboard(leaderboard) {
  return [...leaderboard].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.streak !== a.streak) return b.streak - a.streak;
    return b.roundsCompleted - a.roundsCompleted;
  });
}

// --- Utility ---

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateTotalRounds(gameDuration) {
  return Math.floor(gameDuration / ROUND_DURATION);
}