// File: src/pages/MyShelf.jsx

import React, { useEffect, useState } from 'react'
import { useAuth } from '../AuthProvider'
import { useNavigate } from 'react-router-dom'
import { fetchUserBorrowRequests, cancelBorrowRequest, supabase } from '../supabaseClient' 
import Popup from '../components/Popup'

const STAR_ICON = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.529 9.997a5.905 5.905 0 1011.810 0A5.905 5.905 0 009.529 9.997Zm5.905-4.205a4.505 4.505 0 100 9.01 4.505 4.505 0 000-9.01Z" />
  </svg>
)

export default function MyShelf() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState({ current: [], history: [] })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('current') // 'current' atau 'history'
  const [ratingBook, setRatingBook] = useState(null)
  const [ratingValue, setRatingValue] = useState(0)
  const [ratingComment, setRatingComment] = useState('')

  // State untuk popup
  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: null
  })

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth')
    }
    if (user) {
      loadRequests(user.id)
    }
  }, [user, authLoading, navigate])

  async function loadRequests(userId) {
    try {
      setLoading(true)
      
      // Fetch semua requests termasuk yang sudah dikembalikan
      const { data: allRequests, error } = await supabase
        .from('borrow_requests')
        .select(`
          id, status, borrow_date, due_date, return_date, notes, fine, rating, rating_comment,
          books (id, title, author, cover_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Pisahkan current dan history
      const current = (allRequests || []).filter(r => r.status !== 'returned' && r.status !== 'rejected')
      const history = (allRequests || []).filter(r => r.status === 'returned' || r.status === 'rejected')

      // Sort: yang requested duluan, lalu yang approved
      const sortedCurrent = current.sort((a, b) => {
        if (a.status === 'requested' && b.status !== 'requested') return -1
        if (a.status !== 'requested' && b.status === 'requested') return 1
        return new Date(a.borrow_date) - new Date(b.borrow_date)
      })

      setRequests({
        current: sortedCurrent || [],
        history: history || []
      })
    } catch (err) {
      console.error('Failed to load requests:', err)
      // Set default empty data agar tidak crash
      setRequests({
        current: [],
        history: []
      })
      setPopup({
        isOpen: true,
        type: 'alert',
        title: 'Error',
        message: 'Gagal memuat data rak buku Anda. Silakan coba refresh halaman.'
      })
    } finally {
      setLoading(false)
    }
  }

  function handleCancel(request) {
    setPopup({
      isOpen: true,
      type: 'confirm',
      title: 'Batalkan Permintaan',
      message: `Anda yakin ingin membatalkan permintaan peminjaman untuk buku "${request.books.title}"?`,
      onConfirm: () => confirmCancel(request.id)
    })
  }

  async function confirmCancel(requestId) {
    try {
      await cancelBorrowRequest(requestId)
      setPopup({
        isOpen: true,
        type: 'alert',
        title: 'Sukses',
        message: 'Permintaan peminjaman berhasil dibatalkan.'
      })
      loadRequests(user.id)
    } catch (err) {
      setPopup({
        isOpen: true,
        type: 'alert',
        title: 'Gagal',
        message: 'Gagal membatalkan permintaan. Silakan coba lagi.'
      })
    }
  }

  function handleRating(request) {
    setRatingBook(request)
    setRatingValue(request.rating || 0)
    setRatingComment(request.rating_comment || '')
  }

  async function submitRating() {
    if (ratingValue === 0) {
      setPopup({
        isOpen: true,
        type: 'alert',
        title: 'Validasi',
        message: 'Silakan pilih rating bintang terlebih dahulu.'
      })
      return
    }

    try {
      // Update data di Supabase
      const { error } = await supabase
        .from('borrow_requests')
        .update({ rating: ratingValue, rating_comment: ratingComment })
        .eq('id', ratingBook.id)

      if (error) throw error

      // Update state secara langsung
      setRequests(prevRequests => ({
        ...prevRequests,
        history: prevRequests.history.map(req => 
          req.id === ratingBook.id 
            ? { ...req, rating: ratingValue, rating_comment: ratingComment }
            : req
        )
      }))

      setPopup({
        isOpen: true,
        type: 'alert',
        title: 'Sukses',
        message: 'Rating buku berhasil disimpan!'
      })
      
      setRatingBook(null)
      setRatingValue(0)
      setRatingComment('')
    } catch (err) {
      console.error('Error submitting rating:', err)
      setPopup({
        isOpen: true,
        type: 'alert',
        title: 'Error',
        message: 'Gagal menyimpan rating. Silakan coba lagi.'
      })
    }
  }

  function closePopup() {
    setPopup(prev => ({ ...prev, isOpen: false }))
  }

  function closeRatingModal() {
    setRatingBook(null)
    setRatingValue(0)
    setRatingComment('')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'approved': return 'bg-teal-100 text-teal-800 border-teal-300'
      case 'returned': return 'bg-green-100 text-green-800 border-green-300'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      'requested': 'Diminta',
      'approved': 'Disetujui',
      'returned': 'Dikembalikan',
      'rejected': 'Ditolak'
    }
    return labels[status] || status
  }

  if (authLoading || loading) {
    return (
      <div className="container p-4 pt-8 text-center">
        <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className='text-xl text-teal-600 font-medium'>Memuat rak buku...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const displayRequests = activeTab === 'current' ? requests.current : requests.history

  return (
    <div className="container p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">📚 Rak Buku Saya</h1>
      <p className="mb-6 text-gray-600">
        Kelola buku yang sedang dipinjam dan pantau riwayat peminjaman Anda.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'current'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Peminjaman Aktif ({requests?.current?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'history'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Riwayat Peminjaman ({requests?.history?.length || 0})
        </button>
      </div>

      {/* Content */}
      {displayRequests?.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="text-6xl mb-4">
            {activeTab === 'current' ? '📖' : '📋'}
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {activeTab === 'current' 
              ? 'Tidak ada peminjaman aktif' 
              : 'Belum ada riwayat peminjaman'}
          </h3>
          <p className="text-gray-500 mb-6">
            {activeTab === 'current'
              ? 'Anda belum meminjam buku apa pun saat ini.'
              : 'Mulai pinjam buku untuk melihat riwayat Anda.'}
          </p>
          <button 
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition font-medium shadow-md" 
            onClick={() => navigate('/explore')}
          >
            Mulai Jelajah Buku
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayRequests.map(r => (
            <div 
              key={r.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition hover:shadow-md"
            >
              <div className="flex flex-col md:flex-row">
                {/* Status Bar */}
                <div 
                  className={`h-2 md:h-auto md:w-2 ${
                    r.status === 'approved' ? 'bg-teal-500' : 
                    r.status === 'requested' ? 'bg-yellow-500' :
                    r.status === 'returned' ? 'bg-green-500' :
                    'bg-red-500'
                  }`}
                ></div>

                <div className="p-5 flex-1 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    
                    {/* Info Buku */}
                    <div className="flex gap-4 items-center flex-1">
                        {r.books?.cover_url ? (
                           <img src={r.books.cover_url} alt="cover" className="w-16 h-24 object-cover rounded shadow-sm hidden sm:block"/>
                        ) : (
                           <div className="w-16 h-24 bg-gray-200 rounded hidden sm:flex items-center justify-center text-gray-400 text-xs">No Cover</div>
                        )}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span 
                                    className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wide ${getStatusColor(r.status)}`}
                                >
                                    {getStatusLabel(r.status)}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{r.books?.title || 'Judul Tidak Diketahui'}</h3>
                            <p className="text-sm text-gray-500">{r.books?.author || 'Penulis Tidak Diketahui'}</p>
                            
                            {/* Rating Display - untuk history */}
                            {activeTab === 'history' && r.rating > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <STAR_ICON 
                                      key={i} 
                                      className={`w-4 h-4 ${i < r.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-gray-600">({r.rating}/5)</span>
                              </div>
                            )}
                        </div>
                    </div>

                    {/* Tanggal & Aksi */}
                    <div className="flex flex-col items-start md:items-end gap-1 w-full md:w-auto mt-2 md:mt-0 pl-0 md:pl-4 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Pinjam:</span> {new Date(r.borrow_date).toLocaleDateString('id-ID')}
                        </div>
                        
                        {r.status === 'approved' && (
                            <div className={`text-sm font-bold ${new Date(r.due_date) < new Date() ? 'text-red-600' : 'text-teal-600'}`}>
                                Jatuh Tempo: {new Date(r.due_date).toLocaleDateString('id-ID')}
                            </div>
                        )}

                        {r.status === 'returned' && (
                          <>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Dikembalikan:</span> {new Date(r.return_date).toLocaleDateString('id-ID')}
                            </div>
                            {r.fine > 0 && (
                              <div className="text-sm font-semibold text-red-600">
                                Denda: Rp {r.fine.toLocaleString('id-ID')}
                              </div>
                            )}
                          </>
                        )}

                        <div className="mt-2 flex gap-2 flex-wrap justify-start md:justify-end">
                            {r.status === 'requested' && (
                                <button 
                                    className="px-4 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                                    onClick={() => handleCancel(r)}
                                >
                                    Batalkan
                                </button>
                            )}
                            {r.status === 'approved' && (
                                <button 
                                    className="px-4 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition"
                                    onClick={() => {/* Fitur perpanjang nanti */}}
                                >
                                    Detail
                                </button>
                            )}
                            {r.status === 'returned' && !r.rating && (
                                <button 
                                    className="px-4 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition"
                                    onClick={() => handleRating(r)}
                                >
                                    ⭐ Beri Rating
                                </button>
                            )}
                            {r.status === 'returned' && r.rating && (
                                <button 
                                    className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                                    onClick={() => handleRating(r)}
                                >
                                    ✏️ Edit Rating
                                </button>
                            )}
                        </div>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rating Modal */}
      {ratingBook && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 flex justify-between items-center p-4 border-b border-gray-100 bg-white">
              <h3 className="text-lg font-bold text-gray-900">Beri Rating</h3>
              <button 
                onClick={closeRatingModal}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Book Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-1">{ratingBook.books?.title}</h4>
                <p className="text-sm text-gray-600">{ratingBook.books?.author}</p>
              </div>

              {/* Rating Stars */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Rating</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatingValue(star)}
                      className="focus:outline-none transition transform hover:scale-110"
                    >
                      <STAR_ICON 
                        className={`w-10 h-10 ${
                          star <= ratingValue ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  {ratingValue > 0 ? `${ratingValue} dari 5 bintang` : 'Pilih rating'}
                </p>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Ulasan (Opsional)
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Bagikan pengalaman Anda membaca buku ini..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  rows="4"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={closeRatingModal}
                  className="flex-1 px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={submitRating}
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition"
                >
                  Simpan Rating
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Popup
        isOpen={popup.isOpen}
        onClose={closePopup} 
        onConfirm={popup.onConfirm}
        title={popup.title}
        message={popup.message}
        type={popup.type}
      />
    </div>
  )
}