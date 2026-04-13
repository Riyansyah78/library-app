// File: src/main.jsx (Full Content)
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Pages
import Home from './pages/Home'
import AdminPage from './pages/AdminPage'
import AuthPage from './pages/AuthPage'
import Profile from './pages/Profile'
import UserManagement from './pages/UserManagement'
import MyShelf from './pages/MyShelf'      
import ExplorePage from './pages/ExplorePage'
import Notifications from './pages/Notifications'
import EmailConfirmed from './pages/EmailConfirmed'

// Components & Utils
import './index.css'
import { AuthProvider } from './AuthProvider'
import Layout from './components/Layout' // <--- Import Layout baru

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error caught:', error, errorInfo)
    this.setState({ error: error, errorInfo: errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 text-red-600 max-w-xl mx-auto mt-10 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Terjadi kesalahan!</h2>
          <button 
            onClick={() => window.location.reload()}
            className="bg-gray-800 text-white px-4 py-2 rounded mt-4"
          >
            Refresh Halaman
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Route TANPA Layout (Misal: Login Page) */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/confirmed" element={<EmailConfirmed />} />

            {/* Route DENGAN Layout (Header & Bottom Nav) */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<ExplorePage />} /> 
              <Route path="/myshelf" element={<MyShelf />} />     
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/users" element={<UserManagement />} /> 
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

const rootElement = document.getElementById('root');
if (!rootElement.innerHTML) {
  createRoot(rootElement).render(<App />);
}