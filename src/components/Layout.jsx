// File: src/components/Layout.jsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Desktop (Sudah ada class hidden md:block di dalamnya) */}
      <Header />
      
      {/* Main Content Area */}
      {/* pb-20 ditambahkan agar konten paling bawah tidak tertutup Bottom Nav di mobile */}
      <main className="flex-grow pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom Navigation Mobile */}
      <BottomNav />
    </div>
  )
}