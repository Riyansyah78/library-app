// Script: Seed buku dari Google Books API ke Supabase
// Jalankan: node scripts/seed-books.mjs

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Read .env file manually
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=')
  if (key && vals.length) env[key.trim()] = vals.join('=').trim()
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWV5Zm1kbXpnaGtuZXByYnN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA3MDgzOSwiZXhwIjoyMDkxNjQ2ODM5fQ.QdEgzyx6x81DlpCSPZ6KPbgGq_rO7uya_F9dK5zrSPI' // service_role key (bypass RLS)

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan di .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Kategori dan query pencarian untuk mendapat buku yang bervariasi
const SEARCH_QUERIES = [
  { query: 'subject:fiction bestseller', category: 'Fiksi' },
  { query: 'subject:science popular', category: 'Sains' },
  { query: 'subject:history world', category: 'Sejarah' },
  { query: 'subject:technology programming', category: 'Teknologi' },
  { query: 'subject:philosophy life', category: 'Filosofi' },
  { query: 'subject:biography', category: 'Biografi' },
  { query: 'subject:business leadership', category: 'Bisnis' },
  { query: 'subject:self-help motivation', category: 'Pengembangan Diri' },
  { query: 'subject:mystery thriller', category: 'Misteri' },
  { query: 'subject:romance novel', category: 'Romansa' },
  { query: 'subject:fantasy adventure', category: 'Fantasi' },
  { query: 'subject:education learning', category: 'Pendidikan' },
]

const BOOKS_PER_CATEGORY = 5

async function fetchBooksFromGoogle(searchQuery, maxResults = 10) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=${maxResults}&langRestrict=en&orderBy=relevance&printType=books`
  
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.items || []
  } catch (err) {
    console.error(`⚠️  Gagal fetch "${searchQuery}":`, err.message)
    return []
  }
}

function mapGoogleBookToSchema(item, category) {
  const info = item.volumeInfo || {}
  
  // Ambil cover terbaik yang tersedia
  const cover = info.imageLinks?.thumbnail 
    || info.imageLinks?.smallThumbnail 
    || null

  // Bersihkan cover URL (ganti http ke https)
  const coverUrl = cover ? cover.replace('http://', 'https://') : null

  // Ambil synopsis, potong jika terlalu panjang
  let synopsis = info.description || info.subtitle || 'Tidak ada sinopsis.'
  if (synopsis.length > 1000) {
    synopsis = synopsis.substring(0, 997) + '...'
  }

  return {
    title: info.title || 'Untitled',
    author: (info.authors || ['Unknown']).join(', '),
    category: category,
    cover_url: coverUrl,
    copies: Math.floor(Math.random() * 5) + 1, // 1-5 copies
    synopsis: synopsis,
    hot_month: Math.random() > 0.7 ? new Date().getMonth() + 1 : null, // 30% chance jadi hot
    average_rating: 0,
    rating_count: 0,
  }
}

async function seedBooks() {
  console.log('📚 PustakaConnect - Book Seeder')
  console.log('================================')
  console.log(`🔗 Supabase: ${supabaseUrl}`)
  console.log('')

  // Cek buku yang sudah ada
  const { data: existingBooks, error: checkError } = await supabase
    .from('books')
    .select('title')
  
  if (checkError) {
    console.error('❌ Error cek database:', checkError.message)
    process.exit(1)
  }

  const existingTitles = new Set((existingBooks || []).map(b => b.title.toLowerCase()))
  console.log(`📖 Buku yang sudah ada: ${existingTitles.size}`)
  console.log('')

  let totalAdded = 0
  let totalSkipped = 0

  for (const { query, category } of SEARCH_QUERIES) {
    console.log(`🔍 Mencari: "${category}"...`)
    
    const items = await fetchBooksFromGoogle(query, BOOKS_PER_CATEGORY + 3) // fetch extra untuk antisipasi duplikat
    
    if (items.length === 0) {
      console.log(`   ⚠️  Tidak ada hasil`)
      continue
    }

    const booksToInsert = []

    for (const item of items) {
      if (booksToInsert.length >= BOOKS_PER_CATEGORY) break

      const book = mapGoogleBookToSchema(item, category)
      
      // Skip jika sudah ada
      if (existingTitles.has(book.title.toLowerCase())) {
        totalSkipped++
        continue
      }

      // Skip jika tidak ada cover
      if (!book.cover_url) {
        continue
      }

      booksToInsert.push(book)
      existingTitles.add(book.title.toLowerCase())
    }

    if (booksToInsert.length > 0) {
      const { data, error } = await supabase
        .from('books')
        .insert(booksToInsert)
        .select()

      if (error) {
        console.error(`   ❌ Error insert:`, error.message)
      } else {
        totalAdded += data.length
        data.forEach(b => {
          console.log(`   ✅ ${b.title} — ${b.author}`)
        })
      }
    } else {
      console.log(`   ⏭️  Semua sudah ada, skip`)
    }

    // Delay agar tidak terlalu cepat hit API Google
    await new Promise(r => setTimeout(r, 500))
  }

  console.log('')
  console.log('================================')
  console.log(`✅ Selesai! ${totalAdded} buku ditambahkan, ${totalSkipped} dilewati (duplikat)`)
  console.log('================================')
}

seedBooks().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
