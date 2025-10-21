import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { ClientDashboard } from './components/ClientDashboard'
import { RateMaster } from './components/RateMaster'
import { useRealtimeSubscription } from './hooks/useRealtimeSubscription'
import { queryClient } from './lib/queryClient'

function Navigation() {
  const location = useLocation()
  
  return (
    <nav className="flex space-x-6">
      <Link
        to="/dashboard"
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          location.pathname === '/dashboard'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
      >
        Dashboard
      </Link>
      <Link
        to="/rates"
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          location.pathname === '/rates'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
      >
        Rate Master
      </Link>
    </nav>
  )
}

function AppContent() {
  // Set up real-time subscriptions
  useRealtimeSubscription()
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              BRS Management System
            </h1>
            <Navigation />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ClientDashboard />} />
          <Route path="/rates" element={<RateMaster />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
