import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { brandingConfig } from './config/branding'

// Set dynamic page title from branding configuration
document.title = brandingConfig.app.title

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
