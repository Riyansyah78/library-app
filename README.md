# 📚 PustakaConnect - Sistem Manajemen Perpustakaan Digital

PustakaConnect adalah aplikasi web modern untuk manajemen perpustakaan digital yang memungkinkan user meminjam buku, memberikan rating, dan admin mengelola koleksi buku serta user.

![React](https://img.shields.io/badge/React-18+-blue?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Fitur Utama

### 👥 User Features
- 🔐 **Autentikasi** - Sign up, login, logout dengan Supabase Auth
- 📖 **Browse Buku** - Jelajahi katalog buku dengan search dan filter kategori
- 📝 **Peminjaman** - Request peminjaman buku dengan durasi 7 hari
- 📚 **Rak Saya** - Kelola buku yang sedang dipinjam dan riwayat peminjaman
- ⭐ **Rating & Review** - Beri rating dan ulasan untuk buku yang sudah dibaca
- 🔔 **Notifikasi** - Notifikasi status peminjaman dan reminder jatuh tempo
- 📱 **Mobile Friendly** - Responsive design untuk semua device

### 🛠️ Admin Features
- 📥 **Kelola Buku** - Tambah, edit, hapus buku dengan cover image
- 👤 **Manajemen User** - Kelola user dan hak akses admin
- ✅ **Persetujuan Peminjaman** - Approve/reject request peminjaman
- 📊 **Return Management** - Catat pengembalian dan hitung denda otomatis
- 📈 **Analytics** - Lihat riwayat peminjaman lengkap

## 🚀 Tech Stack

### Frontend
- **React 18** - UI library
- **React Router v6** - Routing
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Swiper** - Carousel

### Backend & Database
- **Supabase** - Backend as a Service (Auth, Database, Storage)
- **PostgreSQL** - Database engine
- **Supabase Edge Functions** - Serverless functions

### Tools
- **Vite** - Build tool
- **npm** - Package manager

## 📋 Prerequisites

- Node.js v16+
- npm atau yarn
- Akun Supabase (gratis di [supabase.com](https://supabase.com))
- Browser modern

## 🔧 Setup & Installation

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/pustakaconnect.git
cd pustakaconnect
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Buat file `.env.local` di root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Dapatkan nilai dari Supabase Dashboard:
- Settings > API > Project URL → `VITE_SUPABASE_URL`
- Settings > API > Project API keys → anon key → `VITE_SUPABASE_ANON_KEY`

### 4. Setup Database (Supabase)

#### a. Buat Tabel-Tabel
Jalankan SQL queries di Supabase SQL Editor:

```sql
-- Tabel Books
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  cover_url TEXT,
  copies INTEGER DEFAULT 1,
  hot_month INTEGER,
  synopsis TEXT,
  average_rating DECIMAL(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Borrow Requests
CREATE TABLE borrow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'requested',
  borrow_date TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP,
  return_date TIMESTAMP,
  notes TEXT,
  fine INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 0,
  rating_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### b. Setup Rating Function & Trigger
```sql
CREATE OR REPLACE FUNCTION update_book_ratings()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE books
  SET 
    average_rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM borrow_requests
      WHERE book_id = NEW.book_id AND rating > 0 AND status = 'returned'
    ), 0),
    rating_count = COALESCE((
      SELECT COUNT(*)
      FROM borrow_requests
      WHERE book_id = NEW.book_id AND rating > 0 AND status = 'returned'
    ), 0)
  WHERE id = NEW.book_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_book_ratings
AFTER INSERT OR UPDATE ON borrow_requests
FOR EACH ROW
WHEN (NEW.rating > 0)
EXECUTE FUNCTION update_book_ratings();
```

#### c. Setup Storage Bucket (untuk cover image)
- Supabase Dashboard > Storage > New Bucket
- Name: `covers`
- Make it public

#### d. Setup RLS (Row Level Security) - Optional
Gunakan policies untuk keamanan data

### 5. Run Development Server
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

## 🏗️ Project Structure

```
pustakaconnect/
├── src/
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── ExplorePage.jsx
│   │   ├── MyShelf.jsx
│   │   ├── AdminPage.jsx
│   │   ├── UserManagement.jsx
│   │   ├── Profile.jsx
│   │   ├── AuthPage.jsx
│   │   └── Notifications.jsx
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── BottomNav.jsx
│   │   ├── Layout.jsx
│   │   ├── BookCard.jsx
│   │   ├── BorrowModal.jsx
│   │   ├── Carousel.jsx
│   │   └── Popup.jsx
│   ├── AuthProvider.jsx
│   ├── supabaseClient.js
│   ├── index.css
│   └── main.jsx
├── .env.local
├── vite.config.js
├── package.json
└── README.md
```

## 🔐 Akses Admin

### Cara Menjadi Admin:
1. Daftar akun baru
2. Login ke Supabase Dashboard
3. Buka tabel `profiles`
4. Update kolom `is_admin` jadi `true` untuk user Anda
5. Refresh aplikasi

Atau di file `AuthProvider.jsx`, tambahkan email Anda di line:
```javascript
isAdmin: user?.user_metadata?.is_admin || 
         user?.email === 'your-admin-email@gmail.com' ||
         false
```

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🌐 Hosting Recommendations

### Untuk Production:

| Provider | Tipe | Harga | Cocok Untuk |
|----------|------|-------|-----------|
| **Vercel** | Static + Serverless | Free-$20/bulan | Frontend React optimal |
| **Netlify** | Static + Serverless | Free-$19/bulan | Easy deployment |
| **Firebase Hosting** | Static + Functions | Free-bayar per use | Google ecosystem |
| **Railway** | Full Stack | $5/bulan | Backend + Frontend |
| **Render** | Full Stack | Free-$7/bulan | Budget-friendly |

### Rekomendasi untuk Project Ini:

**🏆 Best Choice: Vercel**
- Optimisasi React bawaan
- Deploy otomatis dari GitHub
- Edge Functions gratis
- Free tier dengan 100GB bandwidth
```bash
npm run build
# Atau langsung connect GitHub repo ke Vercel
```

**Alternative: Netlify**
- Free tier generous
- Form handling bawaan
- Analytics gratis
```bash
npm run build
# Push ke GitHub, connect ke Netlify
```

## 📦 Build & Deploy

### Build untuk Production:
```bash
npm run build
```

Output akan ada di folder `dist/`

### Deploy ke Vercel:
```bash
npm install -g vercel
vercel
```

### Deploy ke Netlify:
```bash
npm run build
# Drag & drop folder 'dist' ke Netlify
# Atau connect GitHub repository
```

## 🔑 Environment Variables (Production)

Pastikan di hosting provider, set variables:
```
VITE_SUPABASE_URL = your_supabase_url
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
```

- 🔒 Setup Supabase RLS untuk protect data
- 🛡️ Validasi input di backend
- 🔐 Use HTTPS untuk production

## 📊 Database Schema

### books
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| title | VARCHAR | Judul buku |
| author | VARCHAR | Nama penulis |
| category | VARCHAR | Kategori |
| cover_url | TEXT | URL cover image |
| copies | INTEGER | Jumlah copy tersedia |
| hot_month | INTEGER | Bulan featured (1-12) |
| synopsis | TEXT | Sinopsis |
| average_rating | DECIMAL | Rating rata-rata |
| rating_count | INTEGER | Jumlah rating |

### borrow_requests
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| book_id | UUID | Foreign key to books |
| user_id | UUID | Foreign key to auth.users |
| status | VARCHAR | requested/approved/returned/rejected |
| borrow_date | TIMESTAMP | Tanggal peminjaman |
| due_date | TIMESTAMP | Tanggal jatuh tempo |
| return_date | TIMESTAMP | Tanggal pengembalian |
| fine | INTEGER | Denda keterlambatan |
| rating | INTEGER | Rating (1-5) |
| rating_comment | TEXT | Ulasan |

## 🐛 Troubleshooting

### Error: "column does not exist"
- Pastikan semua SQL migrations sudah dijalankan
- Refresh database connection

### Image tidak muncul
- Verify bucket `covers` sudah public
- Check image URL di database valid

### Auth tidak bekerja
- Verify `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` correct
- Restart dev server setelah set env variables

### Rating tidak terupdate
- Pastikan trigger sudah dibuat di database
- Check kolom `average_rating` dan `rating_count` ada

## 📚 API Reference

Semua functions ada di `src/supabaseClient.js`:
- `fetchBooks()` - Get all books
- `fetchBooksPaginated()` - Get books with pagination
- `fetchHotBooks()` - Get featured books
- `addBorrowRequest()` - Submit peminjaman
- `fetchUserBorrowRequests()` - Get user's requests
- `cancelBorrowRequest()` - Cancel request

## 🤝 Contributing

Contributions welcome! Silakan:
1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 👨‍💻 Author

Created by Rynn

## 📞 Support

Ada pertanyaan atau issue? 
- 📧 Email: riyansyahanugrahprtm@gmail.com

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Payment integration
- [ ] Email notifications
- [ ] Advanced search filters
- [ ] Wishlist feature
- [ ] Social sharing
- [ ] Book recommendations (AI)
- [ ] Multi-language support

---

**Made with React + Supabase + Tailwind CSS** 🚀