import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App/index.js'
import { IconStyleProvider } from './components/icons/IconStyleContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IconStyleProvider>
      <App />
    </IconStyleProvider>
  </StrictMode>
)
