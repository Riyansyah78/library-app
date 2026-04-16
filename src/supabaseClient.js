import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export async function fetchBooks() {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching books:', error)
      throw error
    }
    
    console.log('fetchBooks result:', data)
    return data || []
  } catch (err) {
    console.error('fetchBooks error:', err)
    return []
  }
}

// Paginated fetch: when page and pageSize provided, returns { data, count }
export async function fetchBooksPaginated(page, pageSize, filters = {}) {
    const { searchTerm, category } = filters;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    
    let query = supabase.from('books').select('*', { count: 'exact' });

    if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`);
    }

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(start, end);

    if (error) throw error;
    return { data: data || [], count: count || 0 };
}

export async function fetchHotBooks(month){
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('hot_month', month)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching hot books:', err)
    return []
  }
}

export async function fetchBookWithRatings(bookId) {
  try {
    const { data, error } = await supabase
      .from('books')
      .select(`
        *,
        borrow_requests!left(rating, rating_comment)
      `)
      .eq('id', bookId)
      .single()
    
    if (error) throw error
    
    // Hitung average rating
    if (data.borrow_requests) {
      const ratings = data.borrow_requests
        .filter(r => r.rating > 0)
        .map(r => r.rating)
      
      data.average_rating = ratings.length > 0 
        ? (ratings.reduce((a, b) => a + b) / ratings.length).toFixed(1)
        : 0
      data.rating_count = ratings.length
    }
    
    return data
  } catch (err) {
    console.error('Error fetching book with ratings:', err)
    return null
  }
}

export async function addBook(bookData) {
  
  const { data, error } = await supabase
    .from('books')
    .insert([bookData])
    .select()
    
  if (error) {
    console.error('Supabase insert error:', error)
    throw error
  }
  return data
}

export async function updateBook(id, bookData) {
  
  const { data, error } = await supabase
    .from('books')
    .update(bookData)
    .eq('id', id)
    .select()
    
  if (error) {
    console.error('Supabase update error:', error)
    throw error
  }
  return data
}

export async function deleteBook(id){
  const { data, error } = await supabase.from('books').delete().eq('id', id).select()
  if (error) throw error
  return data
}

// Storage helpers (cover upload)
export async function uploadCoverFile(file){
  if(!file) throw new Error('No file provided')
  const ext = file.name.split('.').pop()
  const filePath = `covers/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`
  const { data, error } = await supabase.storage.from('covers').upload(filePath, file, { upsert: false })
  if(error) throw error
  const { data: urlData } = await supabase.storage.from('covers').getPublicUrl(filePath)
  return urlData.publicUrl
}

export async function getPublicUrlFor(path){
  const { data } = await supabase.storage.from('covers').getPublicUrl(path)
  return data?.publicUrl || null
}

export async function fetchRequests(){
  const { data, error } = await supabase
    .from('borrow_requests')
    .select(`
      *,
      books (id, title, author, cover_url)
    `)
    .order('borrow_date', {ascending:false})
  if (error) throw error
  return data
}

export async function addBorrowRequest(req) {
  try {
    const { data, error } = await supabase
      .from('borrow_requests')
      .insert([{
        book_id: req.book_id,
        user_id: req.user_id,
        user_name: req.user_name,
        status: req.status || 'requested',
        borrow_date: req.borrow_date,
        due_date: req.due_date,
        notes: req.notes || null,
        created_at: new Date().toISOString()
      }])
      .select()

    if (error) throw error
    
    return data
  } catch (err) {
    console.error('Error adding borrow request:', err)
    throw err
  }
}

export async function updateRequest(id, patch){
  const { data, error } = await supabase.from('borrow_requests').update(patch).eq('id', id).select()
  if (error) throw error
  return data
}

// Auth helpers
export async function signUpWithEmail(email, password, options = {}){
  const res = await supabase.auth.signUp({ email, password }, options)
  if(res.error) throw res.error
  return res.data
}

export async function signInWithEmail(email, password) {
  console.log('Attempting sign in for:', email)
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Sign in failed:', {
      email: email,
      error: error.message,
      code: error.code,
      status: error.status
    })
    throw error
  }

  console.log('Sign in successful for:', email)
  return data
}

export async function signOut(){
  const res = await supabase.auth.signOut()
  if(res.error) throw res.error
  return res
}

export async function getUser(){
  const { data, error } = await supabase.auth.getUser()
  if(error) throw error
  return data?.user || null
}

export async function updateUser(updates){
  // updates can include { password, data: { full_name } }
  const res = await supabase.auth.updateUser(updates)
  if(res.error) throw res.error
  return res.data
}

export function onAuthStateChange(callback){
  return supabase.auth.onAuthStateChange((event, session) => callback(event, session))
}

export async function resendConfirmationEmail(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
  })
  
  if (error) throw error
  return { success: true }
}

// Tambahkan fungsi-fungsi ini ke file supabaseClient.js

// Fungsi untuk mendapatkan semua users dengan email
export async function getAllUsersWithEmail() {
  try {
    // Fetch dari profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Untuk mendapatkan email, kita perlu query auth.users
    // Ini memerlukan admin API atau custom function
    return profiles || []
  } catch (err) {
    console.error('Error fetching users:', err)
    return []
  }
}

// Fungsi untuk update status admin
export async function updateUserAdminStatus(userId, isAdmin) {
  try {
    // Update di profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_admin: isAdmin })
      .eq('id', userId)
    
    if (profileError) throw profileError

    // Update di auth.users metadata (optional, butuh admin API)
    try {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        { user_metadata: { is_admin: isAdmin } }
      )
      
      if (authError) {
        console.warn('Could not update auth metadata:', authError)
      }
    } catch (authErr) {
      console.warn('Auth update skipped:', authErr)
    }

    return { success: true }
  } catch (err) {
    console.error('Error updating admin status:', err)
    throw err
  }
}

// Fungsi untuk delete user
export async function deleteUserById(userId) {
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId)
    
    if (error) throw error
    
    return { success: true }
  } catch (err) {
    console.error('Error deleting user:', err)
    throw err
  }
}
// Fetch Request Peminjaman Pengguna
export async function fetchUserBorrowRequests(userId) {
  const { data, error } = await supabase
    .from('borrow_requests')
    .select(`
      id, status, borrow_date, due_date, notes,
      books (id, title, author, cover_url)
    `)
    .eq('user_id', userId)
    .not('status', 'eq', 'returned') // Hanya tampilkan yang belum dikembalikan
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Batalkan Permintaan Peminjaman
export async function cancelBorrowRequest(requestId) {
  const { data, error } = await supabase
    .from('borrow_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)
    .select();

  if (error) throw error;
  return data;
}

// Ambil Daftar Kategori (untuk ExplorePage)
export async function fetchCategories() {
    // Asumsi tabel 'categories' ada, atau ambil dari kolom 'category' di tabel 'books' (menggunakan SQL distinct)
    const { data, error } = await supabase
        .from('books')
        .select('category')
        .order('category', { ascending: true })
        .limit(10); // Ambil 10 kategori teratas

    if (error) throw error;
    // Bersihkan dan jadikan unik
    const uniqueCategories = [...new Set(data.map(item => item.category).filter(c => c))];
    return uniqueCategories;
}

// ============================================
// Notification API Functions
// ============================================

// Fetch all notifications for a user
export async function fetchUserNotifications(userId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('fetchUserNotifications error:', err)
    return []
  }
}

// Mark a single notification as read
export async function markNotificationAsRead(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('markNotificationAsRead error:', err)
    throw err
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('markAllNotificationsAsRead error:', err)
    throw err
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) return 0
    return count || 0
  } catch (err) {
    return 0
  }
}

// Create borrow notification
export async function createBorrowNotification({ userId, requestId, bookTitle, action, notes }) {
  let title = ''
  let message = ''
  let type = 'success'

  switch (action) {
    case 'approved':
      title = 'Peminjaman Disetujui'
      message = `Permintaan pinjam buku "${bookTitle}" telah disetujui. Silakan ambil buku di perpustakaan.`
      type = 'success'
      break
    case 'rejected':
      title = 'Peminjaman Ditolak'
      message = `Maaf, permintaan pinjam buku "${bookTitle}" ditolak.${notes ? ' Alasan: ' + notes : ''}`
      type = 'error'
      break
    case 'returned':
      title = 'Buku Dikembalikan'
      message = `Buku "${bookTitle}" telah berhasil dikembalikan.${notes ? ' ' + notes : ''}`
      type = 'success'
      break
    default:
      return null
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title,
        message,
        type,
        related_request_id: requestId
      }])
      .select()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error creating borrow notification:', err)
    return null
  }
}
