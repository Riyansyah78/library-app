// File: src/pages/Home.jsx
import React, { useEffect, useState } from 'react'
import { fetchBooksPaginated, addBorrowRequest, fetchHotBooks } from '../supabaseClient'
import { useAuth } from '../AuthProvider'
import { useNavigate } from 'react-router-dom'
import Carousel from '../components/Carousel'
import BookCard from '../components/BookCard'
import Popup from '../components/Popup'
import BorrowModal from '../components/BorrowModal'

export default function Home(){
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Ambil notificationCount dari useAuth
  const { user, notificationCount } = useAuth() 
  
  const navigate = useNavigate()
  
  // State untuk search input di home
  const [homeSearchTerm, setHomeSearchTerm] = useState('')

  const ICONS = {
    Home: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.635 6.476a.75.75 0 0 1-.432 1.251H19.5v5.75a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1-.75-.75v-3.75a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0-.75.75v3.75a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75v-5.75H4.267a.75.75 0 0 1-.432-1.251l8.635-6.476Z" /></svg>,
    Explore: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.102l4.47 4.47a.75.75 0 1 1-1.06 1.06l-4.47-4.47A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>,
    Scan: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h7V7H3V3zM3 17h7v4H3v-4zM14 3h7V7h-7V3zM14 17h7v4h-7v-4z" /><path fillRule="evenodd" d="M12 7.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75zM12 10.25a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75zM14.25 12a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5zM12 14.75a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75z" clipRule="evenodd" /></svg>,
    Shelf: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3.75 3.75v16.5a.75.75 0 0 0 1.28.56l.092-.092 5.09-5.09a.75.75 0 0 1 1.06 0l5.09 5.09.092.092a.75.75 0 0 0 1.28-.56V3.75a.75.75 0 0 0-1.5 0v11.586L12 9.543l-4.72 4.72V3.75a.75.75 0 0 0-1.5 0Z" /></svg>,
    Profile: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 17.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 .75.75c0 1.241-.941 2.25-2.181 2.25H6.932c-1.24 0-2.18-1.009-2.18-2.25Z" clipRule="evenodd" /></svg>,
    Bell: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M5.25 9.75a.75.75 0 0 1 .75.75V17.25c0 .414.336.75.75.75h10.5a.75.75 0 0 0 .75-.75V10.5a.75.75 0 0 1 1.5 0v6.75A2.25 2.25 0 0 1 16.5 20H6.75A2.25 2.25 0 0 1 4.5 17.25V10.5a.75.75 0 0 1 .75-.75ZM15.75 5.75a.75.75 0 0 0-1.5 0V7a.75.75 0 0 0 1.5 0V5.75ZM12 4.5a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V5.25a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" /></svg>
}
const categories = [
    { name: 'Sains', color: 'blue', icon: '🧪' },
    { name: 'Fiksi', color: 'purple', icon: '🔮' },
    { name: 'Sejarah', color: 'orange', icon: '📜' },
    { name: 'Teknologi', color: 'green', icon: '🤖' },
];

  const pageSize = 10
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageLoading, setPageLoading] = useState(false)

  // State untuk modals
  const [popup, setPopup] = useState({isOpen: false,type: 'alert',title: '',message: '',onConfirm: null})
  const [borrowModal, setBorrowModal] = useState({isOpen: false,book: null})

  useEffect(()=>{ load(page) },[page])

  async function load(p = 1){
    try{
      setPageLoading(true)
      setLoading(true)
      const resp = await fetchBooksPaginated(p, pageSize)
      setBooks(resp.data || [])
      setTotal(resp.count || 0)
    }catch(err){
      console.error(err)
    }finally{
      setLoading(false)
      setTimeout(()=>setPageLoading(false), 250)
    }
  }

  // Fungsi untuk handle pencarian di Home (redirect ke Explore)
  const handleHomeSearch = (e) => {
    if (e.key === 'Enter') {
      navigate('/explore', { state: { search: homeSearchTerm } })
    }
  }

  function handleCheckShelf() {
    if (user) {
      // Jika sudah login, langsung ke halaman MyShelf
      navigate('/myshelf')
    } else {
      // Jika belum login, tampilkan Popup konfirmasi
      setPopup({
        isOpen: true,
        type: 'confirm',
        title: 'Login Diperlukan',
        message: 'Silakan masuk atau daftar untuk melihat status peminjaman dan rak buku Anda.',
        confirmText: 'Masuk / Daftar', // Custom text tombol konfirmasi
        onConfirm: () => navigate('/auth')
      })
    }
  }

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
      await addBorrowRequest({ book_id: borrowModal.book.id, user_id: user.id, user_name: borrowData.borrowerName, status: 'requested', borrow_date: borrowData.borrowDate, due_date: borrowData.dueDate, notes: borrowData.notes })
      setBorrowModal({ isOpen: false, book: null })
      setPopup({ isOpen: true, type: 'alert', title: '✅ Berhasil', message: `Request peminjaman buku "${borrowModal.book.title}" telah terkirim. Tunggu persetujuan dari admin.` })
      load(page)
    } catch(e) {
      const message = e?.message || JSON.stringify(e)
      setBorrowModal({ isOpen: false, book: null })
      setPopup({ isOpen: true, type: 'alert', title: '❌ Error', message: 'Gagal mengirim request: ' + message })
    }
  }

  function closePopup() { setPopup({ ...popup, isOpen: false }) }
  function closeBorrowModal() { setBorrowModal({ isOpen: false, book: null }) }

  const currentMonth = new Date().getMonth() + 1
  const [recommended, setRecommended] = useState([])

  useEffect(()=>{
    fetchHotBooks(currentMonth).then(setRecommended).catch(()=>{})
  },[currentMonth])

  return (
    <div className="bg-gray-50 min-h-screen relative md:pb-8"> 
      
      {/* MOBILE HEADER & SEARCH (Hanya tampil di layar kecil) */}
      <header className="px-4 py-6 bg-white sticky top-0 z-10 shadow-md sm:px-6 md:hidden">
        <div className="flex justify-between items-center mb-4">
            <div>
                <p className="text-sm text-gray-500">Selamat datang kembali,</p>
                <h2 className="text-xl font-bold text-gray-900">
                    {user?.user_metadata?.full_name?.split(' ')[0] || 'Pengunjung'} 👋
                </h2>
            </div>
            <div className="relative cursor-pointer" onClick={() => navigate('/notifications')}>
                <ICONS.Bell className="w-6 h-6 text-gray-600" />
                {/* Gunakan notificationCount dari AuthProvider */}
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
            </div>
        </div>

        {/* Search Bar Mobile - Sekarang Berfungsi */}
        <div className="relative shadow-sm">
            <input 
                type="text" 
                placeholder="Cari judul, penulis..." 
                value={homeSearchTerm}
                onChange={(e) => setHomeSearchTerm(e.target.value)}
                onKeyDown={handleHomeSearch}
                className="w-full bg-gray-100 py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <ICONS.Explore className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
        </div>
      </header>

      {/* CONTENT SCROLL AREA */}
      <div className="pt-4 md:pt-0"> 
        
        {/* Widget Status Peminjaman */}
        <div className="px-4 sm:px-6 lg:px-8 my-6">
            <div 
              className="bg-teal-700 rounded-xl p-4 text-white flex justify-between items-center shadow-lg cursor-pointer"
              onClick={handleCheckShelf}
            >
                <div>
                    <p className="text-sm opacity-80 mb-1">Status Peminjaman</p>
                    <h3 className="text-xl font-bold">Cek Rak Buku Anda</h3>
                    <p className="text-xs mt-3 bg-teal-800 inline-block px-2.5 py-1 rounded-full hover:bg-teal-900 transition">Lihat Detail</p>
                </div>
            </div>
        </div>

        {/* Kategori */}
        <div className="px-4 sm:px-6 lg:px-8 mb-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Jelajahi Kategori</h3>
                <span className="text-teal-600 text-sm font-semibold cursor-pointer hover:text-teal-700" onClick={() => navigate('/explore')}>Lihat Semua</span> 
            </div>
            <div className="flex space-x-4 overflow-x-auto whitespace-nowrap pb-2 no-scrollbar md:flex-wrap md:space-x-6">
                {categories.map((cat, index) => (
                    <div key={index} 
                         className="flex flex-col items-center min-w-[70px] md:min-w-0 cursor-pointer hover:opacity-80 transition"
                         onClick={() => navigate('/explore', { state: { category: cat.name } })}
                    >
                        <div className={`w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2 text-2xl`}>
                            {cat.icon}
                        </div>
                        <span className="text-sm font-medium">{cat.name}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Rekomendasi/Hot Books */}
        <section className="px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Rekomendasi Bulan Ini</h3>
          </div>
          
          {loading ? (
            <p className='text-center text-sm text-gray-500'>Memuat Rekomendasi...</p>
          ) : (
            <Carousel books={recommended} onBorrow={handleBorrow} /> 
          )}
        </section>

        {/* Semua Buku */}
        <section className="px-4 sm:px-6 lg:px-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Semua Buku</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"> 
            {pageLoading || loading ? (
              Array.from({ length: 6 }).map((_, i) => (
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
        </section>
      </div>

      

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