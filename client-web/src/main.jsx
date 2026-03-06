import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { IconModeProvider } from './context/IconModeContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <IconModeProvider defaultMode="compact">
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </IconModeProvider>
  </StrictMode>,
)
