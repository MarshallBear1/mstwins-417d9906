import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import MobileOptimizationsProvider from './components/MobileOptimizationsProvider'
import './index.css'
import App from './App'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MobileOptimizationsProvider />
      <App />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
)
