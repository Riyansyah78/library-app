import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import BookCard from './BookCard'

export default function Carousel({books, onBorrow}){
  if(!books || books.length === 0) return (
    <div className="text-center p-4 text-gray-500">
      Tidak ada rekomendasi buku untuk bulan ini
    </div>
  )
  
  return (
    <div className="carousel">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        spaceBetween={20}
        // slidesPerView default (desktop) diatur tinggi
        slidesPerView={5} 
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000 }}
        breakpoints={{
          320: { slidesPerView: 2, spaceBetween: 10 }, // Mobile: 2 buku per slide
          640: { slidesPerView: 3, spaceBetween: 15 }, // Tablet: 3 buku
          1024: { slidesPerView: 4, spaceBetween: 20 }, // Desktop kecil: 4 buku
          1280: { slidesPerView: 5, spaceBetween: 20 } // Desktop besar: 5 buku
        }}
        style={{ padding: '10px 0' }}
      >
        {books.map(b => (
          <SwiperSlide key={b.id}>
            <BookCard book={b} onBorrow={onBorrow} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}