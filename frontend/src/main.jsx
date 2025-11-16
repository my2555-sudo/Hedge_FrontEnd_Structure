import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { GameProvider } from './contexts/GameContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </AuthProvider>
  </StrictMode>,
)
