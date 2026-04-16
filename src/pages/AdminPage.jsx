import React, { useEffect, useState } from 'react'
import { fetchBooks, addBook, fetchRequests, updateRequest, supabase,fetchCategories, updateBook, deleteBook, uploadCoverFile, createBorrowNotification } from '../supabaseClient'
import { useAuth } from '../AuthProvider'
import { useNavigate } from 'react-router-dom'
import Popup from '../components/Popup'

export default function AdminPage(){
  const [books, setBooks] = useState([])
  const [requests, setRequests] = useState([])
  const [existingCategories, setExistingCategories] = useState([])
  const [form, setForm] = useState({ 
    title: '', 
    author: '', 
    cover_url: '', 
    category: '',
    customCategory: '',
    copies: 1, 
    hot_month: '',
    synopsis: '' 
  })
  const [loading, setLoading] = useState(true)

  // State untuk pencarian & filter buku
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  // State untuk popup
  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: null
  })
  
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [editingId, setEditingId] = useState(null)
  const [activeTab, setActiveTab] = useState('books')

  useEffect(() => {
    if (!isAdmin) {
      navigate('/')
      return
    }
    loadAll()
  }, [isAdmin, navigate])

  async function loadAll() {
  try {
    setLoading(true);
    console.log('Loading books and requests...');
    
    // Load books
    const booksData = await fetchBooks();
    console.log('Books loaded:', booksData);
    // Fix: Set books to empty array if undefined
    setBooks(booksData && Array.isArray(booksData) ? booksData : []);
    
    // Load requests
    const requestsData = await fetchRequests();
    console.log('Requests loaded:', requestsData);
    // Fix: Set requests to empty array if undefined
    setRequests(requestsData && Array.isArray(requestsData) ? requestsData : []);

    // Default categories to ensure they always show up
    const defaultCats = [
      'Fiksi', 'Sains', 'Sejarah', 'Teknologi', 'Filosofi', 
      'Biografi', 'Bisnis', 'Pengembangan Diri', 'Misteri', 'Romansa', 'Fantasi', 'Pendidikan'
    ];
    // Combine fetched cats with default cats and make unique
    const cats = await fetchCategories();
    const fetchedCats = cats || [];
    const uniqueCats = [...new Set([...defaultCats, ...fetchedCats])].sort();
    
    setExistingCategories(uniqueCats);
    
  } catch (err) {
    console.error('Error loading data:', err);
    showPopup('alert', 'Error', 'Gagal memuat data: ' + err.message);
  } finally {
    setLoading(false);
  }
}


  async function onAdd(e){
    e.preventDefault()
    try{
      let coverUrl = form.cover_url

      // Validasi form
      if (!form.title.trim()) {
        showPopup('alert', 'Error', 'Judul tidak boleh kosong')
        return
      }
      if (!form.author.trim()) {
        showPopup('alert', 'Error', 'Penulis tidak boleh kosong')
        return
      }
      const finalCategory = (form.category === 'Lainnya' ? form.customCategory : form.category).trim()
      
      if (!finalCategory) { 
        showPopup('alert', 'Error', 'Kategori wajib diisi'); 
        return 
      }
      
      // Handle file upload jika ada file yang dipilih
      if(form.__file){
        try{
          const url = await uploadCoverFile(form.__file)
          coverUrl = url
        }catch(upErr){
          console.error('upload error', upErr)
          showPopup('alert', 'Error', 'Gagal upload cover: ' + (upErr?.message || upErr))
          return
        }
      }

      // Siapkan data untuk database
      const bookData = {
        title: form.title.trim(),
        author: form.author.trim(),
        category: finalCategory,
        cover_url: coverUrl,
        copies: Number(form.copies),
        hot_month: form.hot_month ? Number(form.hot_month) : null,
        synopsis: form.synopsis?.trim() || ''
      }
      
      console.log('Submitting book data:', bookData)
      
      if(editingId){
        // Update existing book
        const res = await updateBook(editingId, bookData)
        console.log('updateBook res', res)
        showPopup('alert', 'Berhasil', 'Buku berhasil diperbarui')
        setEditingId(null)
      } else {
        // Add new book
        const res = await addBook(bookData)
        console.log('addBook res', res)
        showPopup('alert', 'Berhasil', 'Buku berhasil ditambahkan')
      }
      
      // Reset form
      setForm({ 
        title: '', 
        author: '', 
        cover_url: '', 
        category: '',
        customCategory: '',
        copies: 1, 
        hot_month: '',
        synopsis: '',
        __file: null,
        cover_preview: null
      })
      
      await loadAll()
    }catch(err){
      console.error('addBook error', err)
      const message = err?.message || (err?.error_description) || JSON.stringify(err)
      showPopup('alert', 'Error', 'Gagal menyimpan buku: ' + message)
    }
  }

  function startEdit(book){
    console.log('Editing book:', book)
    setEditingId(book.id)
    setForm({ 
      title: book.title || '', 
      author: book.author || '', 
      cover_url: book.cover_url || '', 
      category: book.category || '',
      customCategory: '',
      copies: book.copies ?? 1, 
      hot_month: book.hot_month ?? '',
      synopsis: book.synopsis || '',
      __file: null,
      cover_preview: null
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleFileChange(e){
    const file = e.target.files?.[0]
    if(!file) return
    
    setForm(f => ({ 
      ...f, 
      __file: file, 
      cover_preview: URL.createObjectURL(file),
      cover_url: ''
    }))
  }

  async function handleDelete(id){
    setPopup({
      isOpen: true,
      type: 'confirm',
      title: 'Konfirmasi Hapus',
      message: 'Apakah Anda yakin ingin menghapus buku ini? Tindakan ini tidak dapat dibatalkan.',
      onConfirm: () => confirmDeleteBook(id)
    })
  }

  async function confirmDeleteBook(id){
    try{
      await deleteBook(id)
      showPopup('alert', 'Berhasil', 'Buku berhasil dihapus')
      await loadAll()
    }catch(e){ 
      console.error(e)
      showPopup('alert', 'Error', 'Gagal menghapus buku: ' + e.message)
    }
  }

  async function approveRequest(req){
    setPopup({
      isOpen: true,
      type: 'confirm',
      title: 'Konfirmasi Persetujuan',
      message: `Apakah Anda yakin ingin menyetujui permintaan peminjaman dari ${req.user_name}?`,
      onConfirm: () => confirmApproveRequest(req)
    })
  }

  async function confirmApproveRequest(req){
    try{
      await updateRequest(req.id, { status: 'approved' })
      await createBorrowNotification({
        userId: req.user_id,
        requestId: req.id,
        bookTitle: req.books?.title || `Book #${req.book_id}`,
        action: 'approved'
      })
      showPopup('alert', 'Berhasil', 'Request disetujui dan notifikasi terkirim')
      await loadAll()
    }catch(err){
      console.error(err)
      showPopup('alert', 'Error', 'Gagal menyetujui request: ' + err.message)
    }
  }

  async function rejectRequest(req){
    setPopup({
      isOpen: true,
      type: 'confirm',
      title: 'Konfirmasi Penolakan',
      message: `Apakah Anda yakin ingin menolak permintaan peminjaman dari ${req.user_name}?`,
      onConfirm: () => confirmRejectRequest(req)
    })
  }

  async function confirmRejectRequest(req){
    try{
      await updateRequest(req.id, { status: 'rejected' })
      await createBorrowNotification({
        userId: req.user_id,
        requestId: req.id,
        bookTitle: req.books?.title || `Book #${req.book_id}`,
        action: 'rejected'
      })
      showPopup('alert', 'Berhasil', 'Request ditolak dan notifikasi terkirim')
      await loadAll()
    }catch(err){
      console.error(err)
      showPopup('alert', 'Error', 'Gagal menolak request: ' + err.message)
    }
  }

  async function markReturned(req){
    setPopup({
      isOpen: true,
      type: 'confirm',
      title: 'Konfirmasi Pengembalian',
      message: `Tandai buku sebagai sudah dikembalikan? Denda akan dihitung otomatis jika terlambat.`,
      onConfirm: () => confirmMarkReturned(req)
    })
  }

  async function confirmMarkReturned(req){
    try{
      const returned = new Date()
      const due = new Date(req.due_date)
      let daysLate = Math.ceil((returned - due) / (1000*60*60*24))
      if(daysLate < 0) daysLate = 0
      const fine = daysLate * 2000
      await updateRequest(req.id, { status: 'returned', return_date: returned.toISOString(), fine })
      await createBorrowNotification({
        userId: req.user_id,
        requestId: req.id,
        bookTitle: req.books?.title || `Book #${req.book_id}`,
        action: 'returned',
        notes: fine > 0 ? `Denda keterlambatan: Rp ${fine.toLocaleString('id-ID')}` : 'Terlambat 0 hari'
      })
      showPopup('alert', 'Berhasil', `Buku ditandai sudah kembali.${fine > 0 ? ` Denda: Rp ${fine.toLocaleString('id-ID')}` : ''} Notifikasi terkirim.`)
      await loadAll()
    }catch(err){
      console.error(err)
      showPopup('alert', 'Error', 'Gagal update return: ' + err.message)
    }
  }

  function showPopup(type, title, message, onConfirm = null) {
    setPopup({
      isOpen: true,
      type: type,
      title: title,
      message: message,
      onConfirm: onConfirm
    })
  }

  function closePopup() {
    setPopup({
      ...popup,
      isOpen: false
    })
  }

  // Filter buku
  const filteredBooks = books.filter(b => {
    const matchSearch = (b.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                        (b.author?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory ? b.category === filterCategory : true;
    return matchSearch && matchCategory;
  })

  // Tampilkan loading saat fetch data
  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p>Memuat data...</p>
      </div>
    )
  }

  // Cek akses admin
  if (!isAdmin) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', color: '#f44336' }}>
          Anda tidak memiliki akses admin. Silakan masuk sebagai admin untuk melihat halaman ini.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '0'
      }}>
        <button
          onClick={() => setActiveTab('books')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: activeTab === 'books' ? '600' : '400',
            color: activeTab === 'books' ? '#0d9488' : '#64748b',
            borderBottom: activeTab === 'books' ? '3px solid #0d9488' : '3px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📚 Manajemen Buku
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: activeTab === 'requests' ? '600' : '400',
            color: activeTab === 'requests' ? '#0d9488' : '#64748b',
            borderBottom: activeTab === 'requests' ? '3px solid #0d9488' : '3px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative'
          }}
        >
          📋 Request Peminjaman
          {requests.filter(r => r.status === 'requested').length > 0 && (
            <span style={{
              position: 'absolute',
              top: '0.25rem',
              right: '-0.5rem',
              background: '#ef4444',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              padding: '0.15rem 0.4rem',
              borderRadius: '9999px',
              minWidth: '1.25rem',
              textAlign: 'center'
            }}>
              {requests.filter(r => r.status === 'requested').length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Manajemen Buku */}
      {activeTab === 'books' && (
        <div>
          <section>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              {editingId ? 'Edit Buku' : 'Tambah Buku'}
            </h2>
            <form className="card form" onSubmit={onAdd}>
              <input
                placeholder="Judul *"
                value={form.title}
                onChange={e=>setForm({...form,title:e.target.value})}
                required
              />
              <input
                placeholder="Penulis *"
                value={form.author}
                onChange={e=>setForm({...form,author:e.target.value})}
                required
              />
              <div className="mt-2 mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori *</label>
                <select
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full p-2 border rounded border-gray-300 bg-white"
                  required
                >
                  <option value="" disabled>Pilih Kategori</option>
                  {existingCategories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                  <option value="Lainnya">Lainnya (Ketik Manual)...</option>
                </select>

                {form.category === 'Lainnya' && (
                  <input
                    placeholder="Ketik kategori baru..."
                    value={form.customCategory || ''}
                    onChange={e=>setForm({...form, customCategory: e.target.value})}
                    className="w-full p-2 border rounded mt-2 border-teal-500"
                    autoFocus
                    required
                  />
                )}
              </div>

              <div className="mt-2">
                <label className="block text-sm font-medium text-slate-700">Sinopsis</label>
                <textarea
                  placeholder="Sinopsis buku..."
                  value={form.synopsis || ''}
                  onChange={e=>setForm({...form,synopsis:e.target.value})}
                  className="mt-1 w-full p-2 border rounded border-gray-300 focus:border-tertiary focus:ring-1 focus:ring-tertiary"
                  rows="4"
                />
              </div>

              <div className="mt-2">
                <label className="block text-sm font-medium text-slate-700">Cover (URL atau Upload)</label>
                <input
                  placeholder="Cover URL"
                  value={form.cover_url}
                  onChange={e=>setForm({...form,cover_url:e.target.value})}
                  className="mt-1"
                />
                <div className="mt-2">
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                </div>
                {form.cover_preview ? (
                  <img src={form.cover_preview} alt="preview" className="mt-2 rounded max-h-40" />
                ) : form.cover_url ? (
                  <img src={form.cover_url} alt="cover" className="mt-2 rounded max-h-40" />
                ) : null}
              </div>

              <input
                type="number"
                min="1"
                placeholder="Jumlah Copies *"
                value={form.copies}
                onChange={e=>setForm({...form,copies:e.target.value})}
                required
              />
              <input
                type="number"
                min="1"
                max="12"
                placeholder="Hot month (1-12, opsional)"
                value={form.hot_month}
                onChange={e=>setForm({...form,hot_month:e.target.value})}
              />

              <div className="mt-4">
                <button className="btn" type="submit">
                  {editingId ? 'Simpan Perubahan' : 'Tambah Buku'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="btn-ghost ml-2"
                    onClick={()=>{
                      setEditingId(null)
                      setForm({
                        title: '',
                        author: '',
                        cover_url: '',
                        category: '',
                        customCategory: '',
                        copies: 1,
                        hot_month: '',
                        synopsis: '',
                        __file: null,
                        cover_preview: null
                      })
                    }}
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </section>

          <section style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Daftar Buku ({filteredBooks.length}{books.length !== filteredBooks.length ? ` dari ${books.length}` : ''})
            </h2>

            {/* --- Area Filter & Cari --- */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '1rem',
              flexWrap: 'wrap'
            }}>
              <input
                type="text"
                placeholder="Cari judul atau penulis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: '1 1 250px',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  flex: '0 1 200px',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Semua Kategori</option>
                {existingCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="card">
              {books.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <p>Belum ada buku.</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Tambahkan buku pertama menggunakan form di atas.
                  </p>
                </div>
              ) : filteredBooks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <p>Tidak ada buku yang cocok dengan pencarian.</p>
                </div>
              ) : (
                <div>
                  {filteredBooks.map(b => (
                    <div key={b.id} className="request-row">
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                          {b.cover_url && (
                            <img
                              src={b.cover_url}
                              alt={b.title}
                              style={{
                                width: '60px',
                                height: '90px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                flexShrink: 0
                              }}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.25rem' }}>
                              {b.title}
                            </strong>
                            <span style={{ color: '#666', fontSize: '0.9rem', display: 'block', marginBottom: '0.25rem' }}>
                              {b.author}
                            </span>
                            <span style={{ color: '#999', fontSize: '0.85rem' }}>
                              Copies: {b.copies ?? 0}
                              {b.hot_month && ` • Hot: Bulan ${b.hot_month}`}
                            </span>
                            {b.synopsis && b.synopsis.toString().trim() !== '' && (
                              <div style={{
                                marginTop: '0.5rem',
                                fontSize: '0.85rem',
                                color: '#666',
                                fontStyle: 'italic'
                              }}>
                                "{b.synopsis.toString().substring(0, 80)}
                                {b.synopsis.toString().length > 80 ? '...' : ''}"
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="actions">
                        <button className="btn" onClick={()=>startEdit(b)}>
                          ✏️ Edit
                        </button>
                        <button className="btn-ghost ml-2" onClick={()=>handleDelete(b.id)}>
                          🗑️ Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Tab: Request Peminjaman */}
      {activeTab === 'requests' && (
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Request Peminjaman ({requests.length})
          </h2>

          {/* Filter tabs for requests */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {['requested', 'approved', 'returned', 'rejected'].map(status => {
              const count = requests.filter(r => r.status === status).length
              if (count === 0) return null
              return (
                <span key={status} style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  background: status === 'requested' ? '#fef3c7' : status === 'approved' ? '#d1fae5' : status === 'returned' ? '#dbeafe' : '#fee2e2',
                  color: status === 'requested' ? '#92400e' : status === 'approved' ? '#065f46' : status === 'returned' ? '#1e40af' : '#991b1b'
                }}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}: {count}
                </span>
              )
            })}
          </div>

          <div className="card">
            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <p>Tidak ada request peminjaman.</p>
              </div>
            ) : (
              <div>
                {requests.map(r => (
                  <div key={r.id} className="request-row" style={{
                    opacity: r.status === 'rejected' ? 0.6 : 1
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                      {r.books?.cover_url && (
                        <img
                          src={r.books.cover_url}
                          alt={r.books?.title || 'book'}
                          style={{
                            width: '50px',
                            height: '75px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            flexShrink: 0
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '0.25rem' }}>
                          {r.books?.title || `Book #${r.book_id}`}
                        </strong>
                        <span style={{ fontSize: '0.9rem', color: '#666', display: 'block' }}>
                          {r.books?.author || 'Unknown author'}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#999', display: 'block', marginTop: '0.25rem' }}>
                          Peminjam: <strong>{r.user_name}</strong> •
                          Status: <strong style={{
                            color: r.status === 'requested' ? '#f59e0b' : r.status === 'approved' ? '#10b981' : r.status === 'returned' ? '#3b82f6' : '#ef4444'
                          }}>{r.status}</strong> •
                          Due: {new Date(r.due_date).toLocaleDateString('id-ID')}
                        </span>
                        {r.notes && (
                          <div style={{
                            marginTop: '0.5rem',
                            fontSize: '0.85rem',
                            color: '#666',
                            fontStyle: 'italic'
                          }}>
                            📝 {r.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="actions">
                      {r.status === 'requested' && (
                        <>
                          <button className="btn" onClick={()=>approveRequest(r)}>
                            ✓ Terima
                          </button>
                          <button className="btn-ghost ml-2" onClick={()=>rejectRequest(r)}>
                            ✕ Tolak
                          </button>
                        </>
                      )}
                      {r.status === 'approved' && (
                        <button className="btn" onClick={()=>markReturned(r)}>
                          ↩️ Tandai Kembali
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
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