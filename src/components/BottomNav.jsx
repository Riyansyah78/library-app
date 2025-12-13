// File: src/components/BottomNav.jsx
import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthProvider'
import { supabase } from '../supabaseClient'
import Popup from './Popup'

// Definisi Ikon (Disalin dari Home.jsx)
const ICONS = {
  Home: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.635 6.476a.75.75 0 0 1-.432 1.251H19.5v5.75a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1-.75-.75v-3.75a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0-.75.75v3.75a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75v-5.75H4.267a.75.75 0 0 1-.432-1.251l8.635-6.476Z" /></svg>,
  Explore: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.102l4.47 4.47a.75.75 0 1 1-1.06 1.06l-4.47-4.47A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>,
  Scan: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h7V7H3V3zM3 17h7v4H3v-4zM14 3h7V7h-7V3zM14 17h7v4h-7v-4z" /><path fillRule="evenodd" d="M12 7.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75zM12 10.25a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75zM14.25 12a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5zM12 14.75a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75z" clipRule="evenodd" /></svg>,
  Shelf: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3.75 3.75v16.5a.75.75 0 0 0 1.28.56l.092-.092 5.09-5.09a.75.75 0 0 1 1.06 0l5.09 5.09.092.092a.75.75 0 0 0 1.28-.56V3.75a.75.75 0 0 0-1.5 0v11.586L12 9.543l-4.72 4.72V3.75a.75.75 0 0 0-1.5 0Z" /></svg>,
  Profile: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 17.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 .75.75c0 1.241-.941 2.25-2.181 2.25H6.932c-1.24 0-2.18-1.009-2.18-2.25Z" clipRule="evenodd" /></svg>,
  Settings: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M11.828 2.25c-.916 0-1.699.663-1.85 1.567l-.183 1.102a.75.75 0 0 0-.65.65l-1.102.183c-.904.151-1.567.934-1.567 1.85v1.414c0 .506-.01 1.01.045 1.512a.75.75 0 0 1-.682.832c-.4.023-.798.034-1.196.034H2.25a.75.75 0 0 0-.75.75v2.694c0 .916.663 1.699 1.567 1.85l1.102.183a.75.75 0 0 0 .65.65l.183 1.102c.151.904.934 1.567 1.85 1.567h1.414c.506 0 1.012.01 1.512-.045a.75.75 0 0 1 .832.682c.023.4.034.798.034 1.196v1.75a.75.75 0 0 0 .75.75h2.694c.916 0 1.699-.663 1.85-1.567l.183-1.102a.75.75 0 0 0 .65-.65l1.102-.183c.904-.151 1.567-.934 1.567-1.85v-1.414c0-.506.01-1.012-.045-1.512a.75.75 0 0 1 .682-.832c.4-.023.798-.034 1.196-.034h1.75a.75.75 0 0 0 .75-.75v-2.694c0-.916-.663-1.699-1.567-1.85l-1.102-.183a.75.75 0 0 0-.65-.65l-.183-1.102C21.449 2.913 20.666 2.25 19.75 2.25h-1.414c-.506 0-1.012-.01-1.512.045a.75.75 0 0 1-.832-.682c-.023-.4-.034-.798-.034-1.196V2.25c0-.414-.336-.75-.75-.75h-2.694ZM12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm3.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" /></svg>,
  Logout: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M3 2.25a.75.75 0 0 0-.75.75v17.5c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75V15a.75.75 0 0 1 1.5 0v4.25a2.25 2.25 0 0 1-2.25 2.25H3A2.25 2.25 0 0 1 .75 19.25V3A2.25 2.25 0 0 1 3 .75h4.25a.75.75 0 0 1 0 1.5H3Z" clipRule="evenodd" /><path fillRule="evenodd" d="M19.584 5.584a.75.75 0 0 0-1.06-1.06l-3 3a.75.75 0 0 0 0 1.06l3 3a.75.75 0 1 0 1.06-1.06L17.604 9H21a.75.75 0 0 0 0-1.5h-3.396l1.98-1.916Z" clipRule="evenodd" /></svg>,
  Close: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>,
  BookOpen: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.3 2.841A1.5 1.5 0 004.5 4.169V19.5a1.5 1.5 0 001.8 1.485m0 0h13.5a1.5 1.5 0 001.8-1.485V4.169a1.5 1.5 0 00-1.8-1.485h-13.5zm0 0V5.5m13.5 0V5.5m-3 6.828l.75.75m-9 0l.75.75m-1.5-3h6.75m-9 3h6.75m-9 3h6.75m-9 3h6.75" /></svg>,
  Users: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 001.591-.079 9.333 9.333 0 005.643-6.24m-7.5-1.5a3 3 0 11-6 0 3 3 0 016 0zm6-1.5a3 3 0 11-6 0 3 3 0 016 0zM3.75 19.128a9.38 9.38 0 012.625.372 9.337 9.337 0 011.591.079 9.333 9.333 0 005.643-6.24m-15.75-1.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
}

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAdmin } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showAdminMenu, setShowAdminMenu] = useState(false)

  // Helper untuk cek halaman aktif
  const isActive = (path) => location.pathname === path
  const getClass = (path) => isActive(path) ? "text-teal-700 font-bold" : "text-gray-400 hover:text-teal-700"

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setShowLogoutConfirm(false)
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleAdminMenuClick = (path) => {
    navigate(path)
    setShowAdminMenu(false)
  }

  return (
    <>
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-around items-center px-2 py-3 text-xs font-medium z-20 shadow-[0_-2px_5px_rgba(0,0,0,0.05)] md:hidden">
        
        {/* Home */}
        <div onClick={() => navigate('/')} className={`flex flex-col items-center cursor-pointer w-1/5 ${getClass('/')}`}>
          <ICONS.Home className="w-5 h-5 mb-1" />
          <span>Beranda</span>
        </div>
        
        {/* Explore */}
        <div onClick={() => navigate('/explore')} className={`flex flex-col items-center cursor-pointer w-1/5 ${getClass('/explore')}`}>
          <ICONS.Explore className="w-5 h-5 mb-1" />
          <span>Jelajah</span>
        </div>
        
        {/* Center Menu - Admin atau Logout */}
        {user ? (
          isAdmin ? (
            // Admin Menu Button
            <div onClick={() => setShowAdminMenu(true)} className="flex flex-col items-center cursor-pointer w-1/5 text-gray-400 hover:text-teal-700">
              <div className="bg-teal-600 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-600/40 border-4 border-white hover:bg-teal-700 transition">
                <ICONS.Settings className="w-5 h-5" />
              </div>
              <span className="text-teal-700 mt-1 font-bold">Admin</span>
            </div>
          ) : (
            // Shelf untuk non-admin
            <div onClick={() => navigate('/myshelf')} className={`flex flex-col items-center cursor-pointer w-1/5 ${getClass('/myshelf')}`}>
              <div className="bg-teal-600 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-600/40 border-4 border-white hover:bg-teal-700 transition">
                <ICONS.Shelf className="w-5 h-5" />
              </div>
              <span className="text-teal-700 mt-1">Rak Ku</span>
            </div>
          )
        ) : (
          // Scan Button untuk tidak login
          <div onClick={() => navigate('/explore')} className="flex flex-col items-center cursor-pointer w-1/5 text-gray-400 hover:text-teal-700">
            <div className="bg-teal-600 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-600/40 border-4 border-white hover:bg-teal-700 transition">
              <ICONS.Scan className="w-5 h-5" />
            </div>
            <span className="mt-1">Cari</span>
          </div>
        )}

        {/* Profile atau Login */}
        {user ? (
          <div onClick={() => navigate('/profile')} className={`flex flex-col items-center cursor-pointer w-1/5 ${getClass('/profile')}`}>
            <ICONS.Profile className="w-5 h-5 mb-1" />
            <span>Profil</span>
          </div>
        ) : (
          <div onClick={() => navigate('/auth')} className="flex flex-col items-center cursor-pointer w-1/5 text-gray-400 hover:text-teal-700">
            <ICONS.Profile className="w-5 h-5 mb-1" />
            <span>Masuk</span>
          </div>
        )}
        
        {/* Logout Button - Tampil jika sudah login */}
        {user && (
          <div onClick={() => setShowLogoutConfirm(true)} className="flex flex-col items-center cursor-pointer w-1/5 text-gray-400 hover:text-red-600 transition">
            <ICONS.Logout className="w-5 h-5 mb-1" />
            <span>Keluar</span>
          </div>
        )}
      </nav>

      {/* Admin Menu Modal */}
      {showAdminMenu && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden flex items-end">
          <div className="w-full bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom">
            {/* Header dengan Close Button */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Menu Admin</h2>
              <button 
                onClick={() => setShowAdminMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <ICONS.Close className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-3">
              {/* Kelola Buku */}
              <button
                onClick={() => handleAdminMenuClick('/admin')}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition"
              >
                <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white">
                  <ICONS.BookOpen className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Kelola Buku</p>
                  <p className="text-xs text-gray-600">Tambah, edit, dan hapus buku</p>
                </div>
              </button>

              {/* Manajemen User */}
              <button
                onClick={() => handleAdminMenuClick('/users')}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition"
              >
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                  <ICONS.Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Manajemen User</p>
                  <p className="text-xs text-gray-600">Kelola pengguna dan hak akses</p>
                </div>
              </button>
            </div>

            {/* Spacing untuk bottom nav */}
            <div className="h-4"></div>
          </div>
        </div>
      )}

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