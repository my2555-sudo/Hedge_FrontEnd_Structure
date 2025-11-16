import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const ensureProfileExists = async (authUser) => {
    try {
      // Check if profile exists
      const { data: existing, error: fetchErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle()
      if (fetchErr) throw fetchErr
      if (existing) return
      // Derive values from user metadata or email local part
      const meta = authUser.user_metadata || {}
      const emailLocal = (authUser.email || '').split('@')[0]
      const username = meta.username || emailLocal || `user_${authUser.id.slice(0, 8)}`
      const fullName = meta.full_name || username
      // Upsert profile (RLS passes because session exists)
      const { error: upsertErr } = await supabase.from('profiles').upsert(
        [{ id: authUser.id, username, full_name: fullName }],
        { onConflict: 'id' }
      )
      if (upsertErr) throw upsertErr
    } catch (e) {
      console.error('ensureProfileExists error:', e)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        ensureProfileExists(session.user).finally(() => fetchProfile(session.user.id))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        ensureProfileExists(session.user).finally(() => fetchProfile(session.user.id))
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, username, fullName) => {
    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName || username,
          },
        },
      })

      if (authError) throw authError

      // If email confirmations are disabled and session exists, ensure profile now
      if (authData.session?.user) {
        await ensureProfileExists(authData.session.user)
        await fetchProfile(authData.session.user.id)
      }

      return { success: true, user: authData.user }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: error.message }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        await ensureProfileExists(data.user)
        await fetchProfile(data.user.id)
      }

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

