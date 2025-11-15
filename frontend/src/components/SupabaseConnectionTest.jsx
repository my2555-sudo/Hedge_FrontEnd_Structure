import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Component to test and verify Supabase connection
 * Add this temporarily to your App.jsx to verify the connection
 */
export default function SupabaseConnectionTest() {
  const [status, setStatus] = useState('checking')
  const [connectionInfo, setConnectionInfo] = useState(null)
  const [testResults, setTestResults] = useState(null)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setStatus('checking')
    
    const results = {
      clientInitialized: false,
      authCheck: null,
      profilesTable: null,
      gameParticipantsTable: null,
    }

    try {
      // Test 1: Check if client is initialized
      if (supabase) {
        results.clientInitialized = true
      }

      // Test 2: Check auth connection
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        results.authCheck = {
          success: !error,
          hasSession: !!session,
          error: error?.message
        }
      } catch (error) {
        results.authCheck = {
          success: false,
          error: error.message
        }
      }

      // Test 3: Check profiles table access
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
        
        results.profilesTable = {
          success: !error,
          error: error?.message,
          canRead: !error
        }
      } catch (error) {
        results.profilesTable = {
          success: false,
          error: error.message
        }
      }

      // Test 4: Check game_participants table access
      try {
        const { data, error } = await supabase
          .from('game_participants')
          .select('id')
          .limit(1)
        
        results.gameParticipantsTable = {
          success: !error,
          error: error?.message,
          canRead: !error
        }
      } catch (error) {
        results.gameParticipantsTable = {
          success: false,
          error: error.message
        }
      }

      setTestResults(results)
      
      // Determine overall status
      const allGood = 
        results.clientInitialized &&
        results.authCheck?.success !== false &&
        (results.profilesTable?.success || results.profilesTable?.error?.includes('permission') || results.profilesTable?.error?.includes('RLS'))
      
      setStatus(allGood ? 'connected' : 'error')
      setConnectionInfo({
        connected: allGood,
        details: results
      })
    } catch (error) {
      setStatus('error')
      setConnectionInfo({
        connected: false,
        error: error.message
      })
    }
  }

  const handleTestInsert = async () => {
    try {
      // This will only work if you're logged in and RLS allows it
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in first to test INSERT')
        return
      }

      // Try to read your own profile (safer than insert)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        alert(`Error: ${error.message}`)
      } else {
        alert(`Success! Found profile: ${data.username}`)
      }
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        left: 10,
        background: status === 'connected' ? '#1a5f1a' : status === 'error' ? '#5f1a1a' : '#5f5f1a',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: '350px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: status === 'connected' ? '#4ade80' : status === 'checking' ? '#fbbf24' : '#ef4444',
            animation: status === 'checking' ? 'pulse 1.5s infinite' : 'none',
          }}
        />
        <strong>
          Supabase: {status === 'connected' ? 'Connected' : status === 'checking' ? 'Checking...' : 'Error'}
        </strong>
        <button
          onClick={checkConnection}
          style={{
            marginLeft: 'auto',
            padding: '4px 8px',
            fontSize: '10px',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>

      {testResults && (
        <div style={{ fontSize: '10px', opacity: 0.9, marginTop: '8px' }}>
          <div>
            {testResults.clientInitialized ? '✓' : '✗'} Client Initialized
          </div>
          <div style={{ marginTop: '4px' }}>
            {testResults.authCheck?.success !== false ? '✓' : '✗'} Auth Service
            {testResults.authCheck?.hasSession && ' (Logged in)'}
          </div>
          <div style={{ marginTop: '4px' }}>
            {testResults.profilesTable?.success ? '✓' : '✗'} Profiles Table
            {testResults.profilesTable?.error && (
              <span style={{ fontSize: '9px', display: 'block', marginTop: '2px', opacity: 0.8 }}>
                {testResults.profilesTable.error.includes('RLS') || testResults.profilesTable.error.includes('permission')
                  ? '⚠ RLS Policy Issue'
                  : testResults.profilesTable.error}
              </span>
            )}
          </div>
          <div style={{ marginTop: '4px' }}>
            {testResults.gameParticipantsTable?.success ? '✓' : '✗'} Game Participants Table
            {testResults.gameParticipantsTable?.error && (
              <span style={{ fontSize: '9px', display: 'block', marginTop: '2px', opacity: 0.8 }}>
                {testResults.gameParticipantsTable.error.includes('RLS') || testResults.gameParticipantsTable.error.includes('permission')
                  ? '⚠ RLS Policy Issue'
                  : testResults.gameParticipantsTable.error}
              </span>
            )}
          </div>
          <button
            onClick={handleTestInsert}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              fontSize: '10px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Test: Read Profile
          </button>
        </div>
      )}

      {connectionInfo && !connectionInfo.connected && connectionInfo.error && (
        <div style={{ fontSize: '10px', opacity: 0.9, marginTop: '8px' }}>
          <div>✗ {connectionInfo.error}</div>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  )
}

