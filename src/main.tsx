import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted Vazirmatn (OFL-1.1): Persian and Latin in one variable font.
import '@fontsource-variable/vazirmatn'
import './index.css'
import './i18n/config'
import App from './App.tsx'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/sonner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <App />
      <Toaster />
    </ThemeProvider>
  </StrictMode>,
)
