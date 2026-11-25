import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './i18n/LanguageContext'
import { RoomProvider } from './context/RoomContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <RoomProvider>
          <App />
        </RoomProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
