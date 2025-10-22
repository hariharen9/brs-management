import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { Button } from './components/ui/button'
import { ClientDashboard } from './components/ClientDashboard'
import { RateMaster } from './components/RateMaster'
import { Analytics } from './components/Analytics'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useRealtimeSubscription } from './hooks/useRealtimeSubscription'
import { Toaster } from './components/Toaster'
import { ErrorBoundary } from './components/ErrorBoundary'
import { queryClient } from './lib/queryClient'

function Navigation() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="flex items-center space-x-2 lg:space-x-8">
      <nav className="flex space-x-1 lg:space-x-8">
        <Link
          to="/dashboard"
          className={`relative px-2 lg:px-3 py-2 text-xs lg:text-sm font-medium transition-all duration-200 ${location.pathname === '/dashboard'
              ? 'text-blue-700'
              : 'text-gray-600 hover:text-blue-600'
            }`}
        >
          <span className="hidden sm:inline">Dashboard</span>
          <span className="sm:hidden">Home</span>
          {location.pathname === '/dashboard' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
          )}
        </Link>
        <Link
          to="/analytics"
          className={`relative px-2 lg:px-3 py-2 text-xs lg:text-sm font-medium transition-all duration-200 ${location.pathname === '/analytics'
              ? 'text-blue-700'
              : 'text-gray-600 hover:text-blue-600'
            }`}
        >
          <span className="hidden sm:inline">Analytics</span>
          <span className="sm:hidden">Stats</span>
          {location.pathname === '/analytics' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
          )}
        </Link>
        <Link
          to="/rates"
          className={`relative px-2 lg:px-3 py-2 text-xs lg:text-sm font-medium transition-all duration-200 ${location.pathname === '/rates'
              ? 'text-blue-700'
              : 'text-gray-600 hover:text-blue-600'
            }`}
        >
          <span className="hidden sm:inline">Rate Master</span>
          <span className="sm:hidden">Rates</span>
          {location.pathname === '/rates' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
          )}
        </Link>
      </nav>
      
      {/* User Menu */}
      <div className="flex items-center space-x-2 lg:space-x-4 border-l border-gray-200 pl-2 lg:pl-4">
        <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span className="max-w-32 truncate">{user?.email}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="flex items-center space-x-1 lg:space-x-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors px-2 lg:px-3"
        >
          <LogOut className="w-3 h-3 lg:w-4 lg:h-4" />
          <span className="hidden sm:inline text-xs lg:text-sm">Sign Out</span>
        </Button>
      </div>
    </div>
  )
}

function AppContent() {
  // Set up real-time subscriptions
  useRealtimeSubscription()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-gradient-to-r from-slate-50 to-blue-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <img 
                src="/brs.jpeg" 
                alt="BRS Industries Logo" 
                className="w-8 h-8 lg:w-10 lg:h-10 object-contain rounded-lg"
              />
              <h1 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent">
                <span className="hidden sm:inline">BRS Admin Dashboard</span>
                <span className="sm:hidden">BRS</span>
              </h1>
            </div>
            <Navigation />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-4 py-4 lg:py-6 min-h-[calc(100vh-120px)] lg:min-h-[calc(100vh-140px)]">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ClientDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/rates" element={<RateMaster />} />
        </Routes>
      </main>

      <footer className="border-t bg-gradient-to-r from-slate-50 to-blue-50 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 py-4">
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          </Router>
        </AuthProvider>
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
