import React, { useEffect, useState } from 'react'
import { fetchBooks, addBook, fetchRequests, updateRequest, supabase,fetchCategories, updateBook, deleteBook, uploadCoverFile } from '../supabaseClient'
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
    copies: 1, 
    hot_month: '',
    synopsis: '' 
  })
  const [loading, setLoading] = useState(true)

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

    // fetchCategories ini sudah ada di supabaseClient.js Anda
      const cats = await fetchCategories();
      // fetchCategories di client Anda mengembalikan array string ['Fiksi', 'Sains']
      setExistingCategories(cats || []);
    
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
      if (!form.category.trim()) { showPopup('alert', 'Error', 'Kategori wajib diisi'); 
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
        category: form.category.trim(),
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
      showPopup('alert', 'Berhasil', 'Request disetujui')
      await loadAll()
    }catch(err){ 
      console.error(err)
      showPopup('alert', 'Error', 'Gagal menyetujui request: ' + err.message)
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
      showPopup('alert', 'Berhasil', `Buku ditandai sudah kembali. Denda: Rp ${fine.toLocaleString('id-ID')}`)
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
            <input 
              list="category-list" 
              placeholder="Pilih atau ketik kategori baru..." 
              value={form.category} 
              onChange={e=>setForm({...form,category:e.target.value})} 
              className="w-full p-2 border rounded"
              required 
            />
            {/* Datalist ini tidak terlihat, tapi muncul sebagai saran saat mengetik */}
            <datalist id="category-list">
              {existingCategories.map((cat, index) => (
                <option key={index} value={cat} />
              ))}
            </datalist>
            <p className="text-xs text-gray-500 mt-1">
              *Ketik manual jika kategori belum ada di daftar.
            </p>
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
          Daftar Buku ({books.length})
        </h2>
        <div className="card">
          {books.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <p>Belum ada buku.</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Tambahkan buku pertama menggunakan form di atas.
              </p>
            </div>
          ) : (
            <div>
              {books.map(b => (
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

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Request Peminjaman ({requests.length})
        </h2>
        <div className="card">
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <p>Tidak ada request peminjaman.</p>
            </div>
          ) : (
            <div>
              {requests.map(r => (
                <div key={r.id} className="request-row">
                  <div>
                    <strong style={{ fontSize: '1rem' }}>{r.user_name}</strong>
                    <br/>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      Book ID: {r.book_id}
                    </span>
                    <br/>
                    <span style={{ fontSize: '0.85rem', color: '#999' }}>
                      Status: <strong>{r.status}</strong> • 
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
                  <div className="actions">
                    {r.status === 'requested' && (
                      <button className="btn" onClick={()=>approveRequest(r)}>
                        ✓ Terima
                      </button>
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