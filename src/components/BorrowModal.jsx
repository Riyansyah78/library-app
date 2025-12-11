// File: src/components/BorrowModal.jsx
import React, { useState, useEffect } from 'react'

export default function BorrowModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  book,
  userName 
}) {
  const [borrowerName, setBorrowerName] = useState(userName || '')
  const [borrowDate] = useState(new Date())
  const [dueDate] = useState(() => {
    const due = new Date()
    due.setDate(due.getDate() + 7)
    return due
  })
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (userName) {
      setBorrowerName(userName)
    }
  }, [userName])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!borrowerName.trim()) {
      alert('Nama peminjam harus diisi')
      return
    }

    setLoading(true)
    
    try {
      await onConfirm({
        borrowerName: borrowerName.trim(),
        borrowDate: borrowDate.toISOString(),
        dueDate: dueDate.toISOString(),
        notes: notes.trim()
      })
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setBorrowerName(userName || '')
      setNotes('')
      onClose()
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      handleClose()
    }
  }

  // Handle scroll lock
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape' && !loading) {
        handleClose()
      }
    }

    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollbarWidth}px`
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = originalOverflow || ''
      document.body.style.paddingRight = originalPaddingRight || ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, loading])

  if (!isOpen || !book) return null

  return (
    <div 
      className="popup-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="borrow-modal-title"
    >
      <div 
        className="popup-content borrow-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        <div className="popup-header">
          <h3 id="borrow-modal-title">📚 Pinjam Buku</h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="popup-body">
            {/* Book Info */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {book.cover_url && (
                  <img 
                    src={book.cover_url} 
                    alt={book.title}
                    style={{
                      width: '80px',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '4px'
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.1rem',
                    color: '#222831'
                  }}>
                    {book.title}
                  </h4>
                  <p style={{ 
                    margin: '0 0 0.25rem 0',
                    fontSize: '0.9rem',
                    color: '#666',
                    fontStyle: 'italic'
                  }}>
                    {book.author}
                  </p>
                  <p style={{ 
                    margin: '0',
                    fontSize: '0.85rem',
                    color: '#999'
                  }}>
                    Tersedia: {book.copies || 0} copy
                  </p>
                </div>
              </div>
            </div>

            {/* Borrower Name */}
            <div style={{ marginBottom: '1rem' }}>
              <label 
                htmlFor="borrower-name"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#333'
                }}
              >
                Nama Peminjam <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                id="borrower-name"
                type="text"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Dates Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '0.9rem'
                }}>
                  Tanggal Pinjam
                </label>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  color: '#666'
                }}>
                  {borrowDate.toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '0.9rem'
                }}>
                  Batas Kembali
                </label>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#fff3cd',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  color: '#856404',
                  fontWeight: '500'
                }}>
                  {dueDate.toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>

            {/* Duration Info */}
            <div style={{
              backgroundColor: '#e7f3ff',
              padding: '0.75rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: '#004085'
            }}>
              <strong>ℹ️ Durasi Peminjaman:</strong> 7 hari
              <br />
              <strong>💰 Denda:</strong> Rp 2.000/hari jika terlambat
            </div>

            {/* Notes */}
            <div>
              <label 
                htmlFor="borrow-notes"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#333'
                }}
              >
                Catatan (Opsional)
              </label>
              <textarea
                id="borrow-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan jika diperlukan..."
                disabled={loading}
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
          
          <div className="popup-footer">
            <button 
              type="button"
              className="btn-ghost popup-btn"
              onClick={handleClose}
              disabled={loading}
            >
              Batal
            </button>
            <button 
              type="submit"
              className="btn popup-btn"
              disabled={loading}
              style={{
                backgroundColor: loading ? '#999' : '#4CAF50',
                borderColor: loading ? '#999' : '#4CAF50',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" style={{ 
                    width: '16px', 
                    height: '16px',
                    borderWidth: '2px'
                  }}></span>
                  Memproses...
                </>
              ) : (
                '✓ Pinjam Buku'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}