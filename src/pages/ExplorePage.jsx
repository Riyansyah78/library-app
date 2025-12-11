// File: src/pages/ExplorePage.jsx

import React, { useEffect, useState, useCallback } from 'react'
import { fetchBooksPaginated, fetchCategories } from '../supabaseClient'
import BookCard from '../components/BookCard'
import { useAuth } from '../AuthProvider'
import { useNavigate, useLocation } from 'react-router-dom' // Tambah useLocation
import BorrowModal from '../components/BorrowModal'
import Popup from '../components/Popup'

// Ikon sederhana (Menggunakan SVG inline)
const ICONS = {
  Search: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.102l4.47 4.47a.75.75 0 1 1-1.06 1.06l-4.47-4.47A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>,
  Filter: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M3.792 2.983A.75.75 0 0 1 4.5 2.5h15a.75.75 0 0 1 .708.483l3.525 7.674c.06.131.092.271.092.413v7.33a2.5 2.5 0 0 1-2.5 2.5H2.5a2.5 2.5 0 0 1-2.5-2.5v-7.33c0-.142.032-.282.092-.413l3.525-7.674ZM12 7.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V7.5Z" clipRule="evenodd" /></svg>
}

export default function ExplorePage() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  
  // State untuk Filter & Pencarian
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState([])

  // State Paginasi
  const pageSize = 12 
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() // Hook untuk membaca state dari navigasi

  const [popup, setPopup] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: null })
  const [borrowModal, setBorrowModal] = useState({ isOpen: false, book: null })

  // Efek untuk menangkap search dari Home Page
  useEffect(() => {
    if (location.state?.search) {
      setSearchTerm(location.state.search)
      // Bersihkan state agar tidak terset ulang saat refresh (opsional)
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const loadBooks = useCallback(async (p, term, category) => {
    try {
      setPageLoading(true)
      if (p === 1) setLoading(true)
      
      const resp = await fetchBooksPaginated(p, pageSize, { 
        searchTerm: term, 
        category: category 
      })
      
      setBooks(resp.data || [])
      setTotal(resp.count || 0)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setTimeout(()=>setPageLoading(false), 250)
    }
  }, [])

  useEffect(() => {
    loadBooks(page, searchTerm, selectedCategory)
  }, [page, searchTerm, selectedCategory, loadBooks])

  useEffect(() => {
    fetchCategories().then(data => {
      setCategories(['Semua', ...data.map(c => c.name || c)])
    }).catch(err => console.error("Failed to load categories:", err))
  }, [])

  async function handleBorrow(book){
    if(!user){
      setPopup({
        isOpen: true,
        type: 'confirm',
        title: 'Login Diperlukan',
        message: 'Anda harus masuk untuk meminjam buku. Mau masuk sekarang?',
        onConfirm: () => navigate('/auth')
      })
      return
    }

    if (!book.copies || book.copies <= 0) {
      setPopup({
        isOpen: true,
        type: 'alert',
        title: 'Buku Tidak Tersedia',
        message: 'Maaf, buku ini sedang tidak tersedia untuk dipinjam.'
      })
      return
    }

    setBorrowModal({ isOpen: true, book: book })
  }

  async function handleBorrowConfirm(borrowData) {
    try {
        // Implementasi logika peminjaman di sini...
        // await addBorrowRequest(...)
        setBorrowModal({ isOpen: false, book: null })
        setPopup({
            isOpen: true,
            type: 'alert',
            title: '✅ Berhasil',
            message: `Request peminjaman buku "${borrowModal.book.title}" telah terkirim.`
        })
    } catch(e) {
        setBorrowModal({ isOpen: false, book: null })
        setPopup({
            isOpen: true,
            type: 'alert',
            title: '❌ Error',
            message: 'Gagal mengirim request: ' + (e?.message || JSON.stringify(e))
        })
    }
  }

  function closePopup() { setPopup({ ...popup, isOpen: false }) }
  function closeBorrowModal() { setBorrowModal({ isOpen: false, book: null }) }

  const handleSearch = (e) => {
    setPage(1)
    setSearchTerm(e.target.value)
  }

  const handleCategoryChange = (category) => {
    setPage(1) 
    setSelectedCategory(category === 'Semua' ? '' : category)
  }

  return (
    <div className="container p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">🔍 Jelajahi Semua Buku</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Cari judul, penulis..." 
            value={searchTerm}
            onChange={handleSearch}
            className="w-full bg-white py-3 pl-12 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-base shadow-sm"
          />
          <ICONS.Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
        </div>

        <div className="relative md:w-1/3">
          <select
            value={selectedCategory || 'Semua'}
            onChange={e => handleCategoryChange(e.target.value)}
            className="w-full bg-white py-3 pl-12 pr-4 rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 text-base shadow-sm"
          >
            {categories.map((cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ICONS.Filter className="w-5 h-5 absolute left-4 top-3.5 text-gray-400 pointer-events-none" />
          <div className="absolute right-4 top-3.5 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-bold mb-4 text-gray-700">
            {selectedCategory || 'Semua'} ({total} {total === 0 ? 'buku' : 'buku'})
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"> 
          {pageLoading || loading ? (
            Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="book-card animate-pulse shadow-md rounded-lg overflow-hidden">
                <div className="w-full h-40 bg-gray-200" />
                <div className="p-3">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-300 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : (
            books.map(b => (
              <BookCard key={b.id} book={b} onBorrow={handleBorrow} />
            ))
          )}
        </div>

        {!loading && books.length === 0 && (
            <div className='text-center p-10 text-gray-500 text-lg bg-white rounded-lg'>
                Tidak ditemukan buku dengan kriteria tersebut.
            </div>
        )}

        {total > pageSize && (
            <div className="mt-8 flex flex-col items-center justify-center space-y-3 pb-4">
            <div className="text-sm text-slate-600">
                Halaman {page} dari {Math.max(1, Math.ceil(total / pageSize))} — Total {total} buku
            </div>
            <div className="flex items-center space-x-2">
                <button 
                className="bg-gray-200 text-gray-700 py-2 px-3 rounded-md text-sm hover:bg-gray-300 disabled:opacity-50 transition" 
                onClick={()=>setPage(p => Math.max(1, p-1))} 
                disabled={page===1}
                >
                &larr; Sebelumnya
                </button>

                <button 
                className="bg-teal-600 text-white py-2 px-3 rounded-md text-sm hover:bg-teal-700 disabled:opacity-50 transition" 
                onClick={()=>setPage(p => p+1)} 
                disabled={page * pageSize >= total}
                >
                Berikutnya &rarr;
                </button>
            </div>
            </div>
        )}
      </section>

      <Popup
        isOpen={popup.isOpen}
        onClose={closePopup}
        onConfirm={popup.onConfirm}
        title={popup.title}
        message={popup.message}
        type={popup.type}
      />

      <BorrowModal
        isOpen={borrowModal.isOpen}
        onClose={closeBorrowModal}
        onConfirm={handleBorrowConfirm}
        book={borrowModal.book}
        userName={user?.user_metadata?.full_name || ''}
      />
    </div>
  )
}