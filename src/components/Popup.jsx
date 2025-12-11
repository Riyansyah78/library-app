// File: src/components/Popup.jsx
import React, { useEffect } from 'react'

export default function Popup({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Ya', 
  cancelText = 'Batal',
  type = 'confirm' // 'confirm', 'alert'
}) {
  
  const handleConfirm = () => {
    if (onConfirm) onConfirm()
    if (onClose) onClose()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose()
    }
  }

  const handleClose = () => {
    if (onClose) onClose()
  }

  // Handle Escape key dan scroll lock/unlock
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    // Lock scroll ketika popup terbuka
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight
    
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollbarWidth}px`
    
    // Add event listener
    document.addEventListener('keydown', handleEscape)

    // Cleanup function - PENTING untuk restore scroll
    return () => {
      document.body.style.overflow = originalOverflow || ''
      document.body.style.paddingRight = originalPaddingRight || ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen]) // Dependency hanya isOpen

  // Jika popup tidak terbuka, return null
  if (!isOpen) return null

  return (
    <div 
      className="popup-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3 id="popup-title">{title}</h3>
        </div>
        
        <div className="popup-body">
          <p>{message}</p>
        </div>
        
        <div className="popup-footer">
          {type === 'confirm' && (
            <>
              <button 
                className="btn-ghost popup-btn"
                onClick={handleClose}
                type="button"
              >
                {cancelText}
              </button>
              <button 
                className="btn popup-btn"
                onClick={handleConfirm}
                type="button"
                autoFocus
              >
                {confirmText}
              </button>
            </>
          )}
          
          {type === 'alert' && (
            <button 
              className="btn popup-btn"
              onClick={handleClose}
              type="button"
              autoFocus
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  )
}