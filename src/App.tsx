import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { ClientDashboard } from './components/ClientDashboard'
import { RateMaster } from './components/RateMaster'
import { Analytics } from './components/Analytics'
import { useRealtimeSubscription } from './hooks/useRealtimeSubscription'
import { queryClient } from './lib/queryClient'

function Navigation() {
  const location = useLocation()

  return (
    <nav className="flex space-x-8">
      <Link
        to="/dashboard"
        className={`relative px-3 py-2 text-sm font-medium transition-all duration-200 ${location.pathname === '/dashboard'
            ? 'text-blue-700'
            : 'text-gray-600 hover:text-blue-600'
          }`}
      >
        Dashboard
        {location.pathname === '/dashboard' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
        )}
      </Link>
      <Link
        to="/analytics"
        className={`relative px-3 py-2 text-sm font-medium transition-all duration-200 ${location.pathname === '/analytics'
            ? 'text-blue-700'
            : 'text-gray-600 hover:text-blue-600'
          }`}
      >
        Analytics
        {location.pathname === '/analytics' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
        )}
      </Link>
      <Link
        to="/rates"
        className={`relative px-3 py-2 text-sm font-medium transition-all duration-200 ${location.pathname === '/rates'
            ? 'text-blue-700'
            : 'text-gray-600 hover:text-blue-600'
          }`}
      >
        Rate Master
        {location.pathname === '/rates' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
        )}
      </Link>
    </nav>
  )
}

function AppContent() {
  // Set up real-time subscriptions
  useRealtimeSubscription()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-gradient-to-r from-slate-50 to-blue-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BRS</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent">
                BRS Management System
              </h1>
            </div>
            <Navigation />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 min-h-[calc(100vh-140px)]">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ClientDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/rates" element={<RateMaster />} />
        </Routes>
      </main>

      <footer className="border-t bg-gradient-to-r from-slate-50 to-blue-50 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <p className="text-sm text-gray-600">
              Made with{' '}
              <span className="text-red-500 animate-pulse">❤️</span>
              {' '}by{' '}
              <a
                href="https://hariharen9.site"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200 hover:underline"
              >
                Hariharen
              </a>
            </p>
          </div>
        </div>
      </footer>
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
