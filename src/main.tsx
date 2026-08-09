import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { DataProvider } from '@/lib/store'
import { AuthProvider } from '@/lib/auth'
import { ToastProvider } from '@/lib/toast'

const Router = import.meta.env.VITE_HASH_ROUTER === 'true' ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  </StrictMode>,
)
