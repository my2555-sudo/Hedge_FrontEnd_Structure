# OpenRouter AI Coach Setup

The AI Coach now uses OpenRouter API to provide intelligent, personalized feedback after each round and on-demand.

## Setup Instructions

### 1. Get Your OpenRouter API Key

1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to your API Keys section
4. Create a new API key
5. Copy your API key

### 2. Configure Environment Variable

Create a `.env` file in the `frontend/` directory (if it doesn't exist) and add:

```env
VITE_OPENROUTER_API_KEY=your_api_key_here
```

**Optional:** You can also specify a different model:
```env
VITE_OPENROUTER_MODEL=openai/gpt-4o-mini
```

Default model is `openai/gpt-4o-mini` (fast and cost-effective).

### 3. Restart Development Server

After adding the environment variable, restart your development server:

```bash
cd frontend
npm run dev
```

## Features

### Automatic Round-End Feedback
- After each round completes, the AI Coach automatically opens with:
  - Investment style analysis (Conservative, Moderate, Aggressive/Risky, Balanced)
  - Round-specific performance metrics
  - Personalized coaching tips based on your trading behavior
  - Strengths and areas for improvement

### On-Demand Feedback
- Click the "💡 Get Feedback" button anytime during gameplay
- Get real-time analysis of your trading decisions
- Receive actionable advice based on current market conditions

### Investment Style Analysis
The AI Coach analyzes your trading patterns and categorizes your style:
- **Conservative**: Low-risk, steady approach
- **Moderate**: Balanced risk-reward strategy
- **Aggressive/Risky**: High-risk, high-reward trading
- **Balanced**: Well-diversified, strategic approach

### Feedback Modes
- **Serious Mode**: Professional, analytical feedback with financial terminology
- **Playful Mode**: Casual, engaging feedback with emojis and conversational tone

## How It Works

1. **Round Tracking**: The system tracks:
   - Number of trades per round
   - Number of events per round
   - Round-specific P/L
   - Trading patterns and reactions

2. **AI Analysis**: OpenRouter AI analyzes:
   - Your trading behavior (panic selling, aggressive buying, passive response, etc.)
   - Portfolio diversification
   - Reaction to market events
   - Risk management patterns

3. **Personalized Feedback**: The AI generates:
   - 3-4 specific, actionable tips
   - Investment style assessment
   - Strengths identification
   - Areas for improvement

## Troubleshooting

### API Key Not Working
- Ensure your API key is correctly set in `.env` file
- Check that the variable name is exactly `VITE_OPENROUTER_API_KEY`
- Restart the development server after adding the key
- Verify your OpenRouter account has credits available

### Feedback Not Appearing
- Check browser console for error messages
- Ensure you have an active internet connection
- Verify your OpenRouter API key has sufficient credits

### Fallback Behavior
If the API key is not provided or there's an error:
- The system falls back to rule-based feedback from `mockFeedback.js`
- You'll still receive helpful tips, but they won't be AI-generated
- A message will indicate that live AI coaching is disabled

## Cost Considerations

OpenRouter uses a pay-per-use model. The default model (`gpt-4o-mini`) is cost-effective:
- Approximately $0.15 per 1M input tokens
- Approximately $0.60 per 1M output tokens
- Each feedback request uses ~500-800 tokens

For a typical game session:
- ~10 rounds × 1 feedback per round = ~$0.01-0.02 per game

## API Response Format

The AI Coach expects a JSON response with:
```json
{
  "investmentStyle": "Moderate",
  "styleDescription": "Brief description",
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2"]
}
```


