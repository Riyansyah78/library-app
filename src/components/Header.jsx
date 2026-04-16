// File: src/components/Header.jsx

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider'
import { supabase, getUnreadNotificationCount } from '../supabaseClient'
import Popup from './Popup'

export default function Header() {

  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadUnreadCount()
    }
  }, [user])

  async function loadUnreadCount() {
    try {
      const count = await getUnreadNotificationCount(user.id)
      setUnreadCount(count)
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setShowLogoutConfirm(false)
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <>
      {/* Header Desktop */}
      {/* "hidden md:block" -> Sembunyikan di Mobile, Tampilkan di Desktop (Medium screen ke atas) */}
      {/* "sticky top-0 z-50" -> Agar header tetap menempel di atas saat scroll */}
      <header className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm font-sans">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          
          {/* LOGO / BRAND */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white text-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-800 group-hover:text-teal-700 transition">
              Pustaka Connect
            </span>
          </Link>

          {/* NAVIGATION LINKS */}
          <nav className="flex items-center gap-8">
            <Link 
              to="/" 
              className="text-gray-600 font-medium hover:text-teal-600 transition text-sm lg:text-base"
            >
              Beranda
            </Link>
            <Link 
              to="/explore" 
              className="text-gray-600 font-medium hover:text-teal-600 transition text-sm lg:text-base"
            >
              Jelajah
            </Link>
            
            {/* Admin Section */}
            {isAdmin && (
              <div className="flex items-center gap-4 px-4 py-1 bg-gray-50 rounded-lg border border-gray-200 mx-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Admin Area:</span>
                <Link to="/admin" className="text-teal-700 font-semibold hover:text-teal-900 text-sm">
                  Kelola Buku
                </Link>
                <Link to="/users" className="text-teal-700 font-semibold hover:text-teal-900 text-sm">
                  Users
                </Link>
              </div>
            )}

            {/* User Menu - Login */}
            {user ? (
              <>
                <Link 
                  to="/myshelf" 
                  className="text-gray-600 font-medium hover:text-teal-600 transition text-sm lg:text-base"
                >
                  Rak Saya
                </Link>
                
                {/* Divider */}
                <div className="h-6 w-px bg-gray-300 mx-2"></div>

                {/* Notifications Bell */}
                <Link
                  to="/notifications"
                  className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition"
                  title="Notifikasi"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-600">
                    <path d="M5.85 3a3 3 0 00-2.115 5.232l1.105.221.897 1.794A3 3 0 006.6 13.05l.3 1.2V17a2.25 2.25 0 002.25 2.25h6.3A2.25 2.25 0 0017.4 17v-2.75l.3-1.2a3 3 0 00.868-2.802l.897-1.794 1.105-.221A3 3 0 0018.15 3h-12.3zM9.9 20.25a4.5 4.5 0 019 0H9.9z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold min-w-5 h-5 flex items-center justify-center rounded-full px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile & Logout */}
                <div className="flex items-center gap-4">
                  {/* Profile Link */}
                  <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
                    <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-xs">
                      {user.user_metadata?.full_name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden lg:block">
                      {user.user_metadata?.full_name?.split(' ')[0]}
                    </span>
                  </Link>

                  {/* Logout Button - Trigger Popup */}
                  <button 
                    onClick={() => setShowLogoutConfirm(true)}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition"
                  >
                    Keluar
                  </button>
                </div>
              </>
            ) : (
              /* Login Button */
              <Link 
                to="/auth" 
                className="px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 transition shadow-sm hover:shadow-md"
              >
                Masuk / Daftar
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Logout Confirmation Popup */}
      <Popup
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari akun?"
        confirmText="Ya, Keluar"
        cancelText="Batal"
        type="confirm"
      />
    </>
  )
}