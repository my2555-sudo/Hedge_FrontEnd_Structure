import { supabase } from '../lib/supabase'

/**
 * Get or create a game participant for the current user
 */
export async function getOrCreateGameParticipant(userId, gameId, initialCashBalance = 10000) {
  try {
    // First, try to find existing participant
    const { data: existing, error: fetchError } = await supabase
      .from('game_participants')
      .select('*')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .single()

    if (existing) {
      return { success: true, participant: existing }
    }

    // If not found, create a new participant
    const { data: newParticipant, error: insertError } = await supabase
      .from('game_participants')
      .insert([
        {
          user_id: userId,
          game_id: gameId,
          cash_balance: initialCashBalance,
        },
      ])
      .select()
      .single()

    if (insertError) throw insertError

    return { success: true, participant: newParticipant }
  } catch (error) {
    console.error('Error getting/creating game participant:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update game participant's cash balance
 */
export async function updateGameParticipantCashBalance(participantId, newCashBalance) {
  try {
    const { data, error } = await supabase
      .from('game_participants')
      .update({ cash_balance: newCashBalance })
      .eq('id', participantId)
      .select()
      .single()

    if (error) throw error

    return { success: true, participant: data }
  } catch (error) {
    console.error('Error updating cash balance:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all game participants for a specific game
 */
export async function getGameParticipants(gameId) {
  try {
    const { data, error } = await supabase
      .from('game_participants')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          full_name
        )
      `)
      .eq('game_id', gameId)
      .order('cash_balance', { ascending: false })

    if (error) throw error

    return { success: true, participants: data || [] }
  } catch (error) {
    console.error('Error fetching game participants:', error)
    return { success: false, error: error.message, participants: [] }
  }
}

/**
 * Get game participant by user ID and game ID
 */
export async function getGameParticipant(userId, gameId) {
  try {
    const { data, error } = await supabase
      .from('game_participants')
      .select('*')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .single()

    if (error) throw error

    return { success: true, participant: data }
  } catch (error) {
    console.error('Error fetching game participant:', error)
    return { success: false, error: error.message, participant: null }
  }
}

