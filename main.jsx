import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './i18n/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { RoomProvider } from './context/RoomContext'
import '@fontsource/chonburi/latin-400.css'
import '@fontsource/chonburi/thai-400.css'
import '@fontsource/sarabun/latin-400.css'
import '@fontsource/sarabun/thai-400.css'
import '@fontsource/sarabun/latin-500.css'
import '@fontsource/sarabun/thai-500.css'
import '@fontsource/sarabun/latin-600.css'
import '@fontsource/sarabun/thai-600.css'
import '@fontsource/sarabun/latin-700.css'
import '@fontsource/sarabun/thai-700.css'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <RoomProvider>
            <App />
          </RoomProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
