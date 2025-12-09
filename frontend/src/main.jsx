import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { GameProvider } from './contexts/GameContext'

console.log('🚀 Starting React app...')

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ Root element #root not found!')
  throw new Error('Root element #root not found in HTML!')
}

console.log('✅ Root element found, mounting React...')

try {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <AuthProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </AuthProvider>
    </StrictMode>,
  )
  console.log('✅ React app mounted successfully!')
} catch (error) {
  console.error('❌ Failed to mount React app:', error)
  rootElement.innerHTML = `
    <div style="padding: 40px; text-align: center; color: white; background: #1a1a1a; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <h1 style="color: #ff4d4f; margin-bottom: 20px;">⚠️ React Mount Error</h1>
      <p style="margin-bottom: 10px;">${error.message}</p>
      <pre style="background: #2a2a2a; padding: 20px; border-radius: 8px; text-align: left; max-width: 800px; overflow: auto; font-size: 12px;">${error.stack}</pre>
      <p style="margin-top: 20px; font-size: 14px; opacity: 0.7;">Check the browser console for more details</p>
    </div>
  `
}
