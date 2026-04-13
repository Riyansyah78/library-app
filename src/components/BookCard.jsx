import React, { useState } from 'react'
import { motion } from 'framer-motion'

const STAR_ICON = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.529 9.997a5.905 5.905 0 1011.810 0A5.905 5.905 0 009.529 9.997Zm5.905-4.205a4.505 4.505 0 100 9.01 4.505 4.505 0 000-9.01Z" />
  </svg>
)

export default function BookCard({book, onBorrow}){
  const [showFullSynopsis, setShowFullSynopsis] = useState(false)
  
  const toggleSynopsis = (e) => {
    e.stopPropagation()
    setShowFullSynopsis(!showFullSynopsis)
  }

  const renderSynopsis = () => {
    if (!book.synopsis) return null
    
    const synopsis = book.synopsis.toString().trim()
    if (!synopsis) return null

    if (showFullSynopsis || synopsis.length <= 100) {
      return (
        <>
          <p className="text-xs text-gray-200">{synopsis}</p>
          {synopsis.length > 100 && (
            <button 
              onClick={toggleSynopsis}
              className="text-xs text-blue-300 hover:text-blue-200 hover:underline mt-1"
            >
              {showFullSynopsis ? 'Lihat sebagian' : 'Lihat selengkapnya'}
            </button>
          )}
        </>
      )
    } else {
      return (
        <>
          <p className="text-xs text-gray-200">{synopsis.substring(0, 100) + '...'}</p>
          <button 
            onClick={toggleSynopsis}
            className="text-xs text-blue-300 hover:text-blue-200 hover:underline mt-1"
          >
            Lihat selengkapnya
          </button>
        </>
      )
    }
  }

  // Render rating stars
  const renderRatingStars = () => {
    const rating = book.average_rating || 0
    const count = book.rating_count || 0

    if (count === 0) return null

    return (
      <div className="flex items-center gap-1.5 mb-2">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <STAR_ICON 
              key={i} 
              className={`w-3 h-3 ${i < Math.round(rating) ? 'text-yellow-300' : 'text-gray-400'}`}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-yellow-300">
          {rating.toFixed(1)}
        </span>
        <span className="text-xs text-gray-300">
          ({count})
        </span>
      </div>
    )
  }

  return (
    <motion.div 
      className="book-card"
      whileHover={{ scale: 1.03 }}
    >
      <div className="cover-wrap">
        <img 
          src={book.cover_url || 'https://via.placeholder.com/140x200?text=No+Cover'} 
          alt={book.title} 
          className="cover"
        />
        <div className="overlay">
          <div className="overlay-content">
            <div className="book-info">
              <h3 className="book-title">{book.title}</h3>
              <p className="book-author">{book.author}</p>
              
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <p className="book-copies m-0">Copies: {book.copies ?? 0}</p>
                {book.category && (
                  <span className="bg-teal-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                    {book.category}
                  </span>
                )}
              </div>
              
              {/* Rating Display */}
              {renderRatingStars()}
              
              {book.synopsis && book.synopsis.toString().trim() !== '' && (
                <div className="book-synopsis">
                  <p className="synopsis-label">Sinopsis:</p>
                  {renderSynopsis()}
                </div>
              )}
            </div>
            
            <div className="borrow-button-container">
              <button 
                className="btn borrow-button"
                onClick={(e) => {
                  e.stopPropagation()
                  onBorrow && onBorrow(book)
                }}
              >
                Pinjam
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}