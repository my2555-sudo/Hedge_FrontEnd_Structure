# AI Coach Setup Instructions

## Issues Fixed

1. **API Key Variable**: Changed from `VITE_HF_API_KEY` to `VITE_OPENROUTER_API_KEY`
2. **Cookie Auth Error**: Added `credentials: 'omit'` to fetch requests to prevent OpenRouter cookie auth errors
3. **Round-End Feedback**: Now uses AI Coach with personalized analysis
4. **Hard-coded Tips**: Hidden when AI tips are available

## Setup Steps

1. **Set your OpenRouter API Key**:
   Create a `.env` file in the `frontend/` directory (or add to existing `.env`):
   ```
   VITE_OPENROUTER_API_KEY=your_api_key_here
   ```

2. **Get OpenRouter API Key**:
   - Go to https://openrouter.ai/
   - Sign up/login
   - Go to Keys section
   - Create a new API key
   - Copy the key and add it to your `.env` file

3. **Restart the dev server** after adding the API key:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   cd frontend && npm run dev
   ```

## How It Works

### Round-End Feedback (Every 30 seconds)
- Automatically opens a popup with AI analysis
- Shows:
  - Round P/L
  - Trades and events this round
  - News comprehension score
  - Personalized AI feedback based on your actual gameplay
  - Investment style analysis
  - Strengths and areas to improve

### Game-End Feedback (After 5 minutes)
- Comprehensive final analysis
- Overall performance metrics
- Investment style assessment
- Personalized tips based on entire game

## Troubleshooting

### "No cookie auth credentials found" Error
- **Fixed**: Added `credentials: 'omit'` to fetch requests
- If you still see this error, check that your API key is correct

### AI Coach Shows "Generating..." Forever
- Check browser console for errors
- Verify API key is set correctly in `.env`
- Check OpenRouter dashboard for API usage/credits
- Ensure you have credits in your OpenRouter account

### Hard-coded Tips Showing Instead of AI
- Make sure `VITE_OPENROUTER_API_KEY` is set
- Restart the dev server after adding the key
- Check browser console for API errors

## Testing

1. Start the game
2. Wait 30 seconds - you should see a round-end feedback popup with AI analysis
3. Continue playing - more popups will appear every 30 seconds
4. After 5 minutes, you'll see the final game-end feedback

The AI Coach analyzes:
- Which events you reacted to
- Reaction correctness and timing
- Missed opportunities
- Trading patterns
- Portfolio concentration
- Overall strategy

