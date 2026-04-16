import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.35.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = 'PustakaConnect <noreply@pustakaconnect.com>'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface EmailData {
  email: string
  fullName: string
  bookTitle: string
  dueDate: string
  overdueDays?: number
  fine?: number
}

const EMAIL_TEMPLATES = {
  dueTomorrow: (data: EmailData) => ({
    subject: 'Reminder: Buku harus dikembalikan besok',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0d9488;">Hai, ${data.fullName}!</h2>
        <p>Ini adalah pengingat bahwa buku <strong>"${data.bookTitle}"</strong> harus dikembalikan <strong>besok</strong> (${data.dueDate}).</p>
        <p>Silakan kembalikan buku ke perpustakaan sebelum jam kerja berakhir.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Salam,<br/>Tim PustakaConnect</p>
      </div>
    `
  }),
  dueToday: (data: EmailData) => ({
    subject: 'Hari ini: Jatuh tempo pengembalian buku',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #f59e0b;">Hai, ${data.fullName}!</h2>
        <p>Buku <strong>"${data.bookTitle}"</strong> jatuh tempo <strong>hari ini</strong> (${data.dueDate}).</p>
        <p>Harap kembalikan buku tersebut ke perpustakaan segera.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Salam,<br/>Tim PustakaConnect</p>
      </div>
    `
  }),
  overdue: (data: EmailData) => ({
    subject: 'Peringatan: Buku terlambat dikembalikan',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ef4444;">Hai, ${data.fullName}!</h2>
        <p>Buku <strong>"${data.bookTitle}"</strong> terlambat dikembalikan selama <strong>${data.overdueDays} hari</strong>.</p>
        ${data.fine && data.fine > 0 ? `<p>Denda keterlambatan: <strong>Rp ${data.fine.toLocaleString('id-ID')}</strong></p>` : ''}
        <p>Harap segera kembalikan buku dan selesaikan pembayaran denda jika ada.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Salam,<br/>Tim PustakaConnect</p>
      </div>
    `
  }),
  borrowApproved: (data: EmailData) => ({
    subject: 'Peminjaman Disetujui - PustakaConnect',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Hai, ${data.fullName}!</h2>
        <p>Permintaan pinjam buku <strong>"${data.bookTitle}"</strong> telah disetujui!</p>
        <p>Silakan ambil buku di perpustakaan dengan menunjukkan bukti peminjaman.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Salam,<br/>Tim PustakaConnect</p>
      </div>
    `
  }),
  borrowRejected: (data: EmailData) => ({
    subject: 'Peminjaman Ditolak - PustakaConnect',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ef4444;">Hai, ${data.fullName}!</h2>
        <p>Maaf, permintaan pinjam buku <strong>"${data.bookTitle}"</strong> ditolak oleh admin.</p>
        <p>Silakan coba pinjam buku lain atau hubungi perpustakaan untuk informasi lebih lanjut.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Salam,<br/>Tim PustakaConnect</p>
      </div>
    `
  }),
  bookReturned: (data: EmailData) => ({
    subject: 'Buku Berhasil Dikembalikan - PustakaConnect',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Hai, ${data.fullName}!</h2>
        <p>Buku <strong>"${data.bookTitle}"</strong> telah dikembalikan.</p>
        ${data.fine && data.fine > 0 ? `<p style="color: #ef4444;">Denda keterlambatan: <strong>Rp ${data.fine.toLocaleString('id-ID')}</strong></p>` : '<p>Pengembalian tepat waktu. Terima kasih!</p>'}
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Salam,<br/>Tim PustakaConnect</p>
      </div>
    `
  })
}

interface BorrowRequest {
  id: string
  user_id: string
  due_date: string
  fine?: number
  books: { title: string }
  profiles: { full_name: string }
}

serve(async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 1. Fetch books due tomorrow
    const { data: dueTomorrow } = await supabase
      .from('borrow_requests')
      .select(`id, user_id, due_date, fine, books (title), profiles!borrow_requests_user_id_fkey (full_name)`)
      .eq('status', 'approved')
      .gte('due_date', tomorrow.toISOString())
      .lt('due_date', new Date(tomorrow.getTime() + 86400000).toISOString()) as { data: BorrowRequest[] | null }

    // 2. Fetch books due today
    const { data: dueToday } = await supabase
      .from('borrow_requests')
      .select(`id, user_id, due_date, fine, books (title), profiles!borrow_requests_user_id_fkey (full_name)`)
      .eq('status', 'approved')
      .gte('due_date', today.toISOString())
      .lt('due_date', tomorrow.toISOString()) as { data: BorrowRequest[] | null }

    // 3. Fetch overdue books
    const { data: overdue } = await supabase
      .from('borrow_requests')
      .select(`id, user_id, due_date, fine, books (title), profiles!borrow_requests_user_id_fkey (full_name)`)
      .eq('status', 'approved')
      .lt('due_date', today.toISOString()) as { data: BorrowRequest[] | null }

    // 4. Get user emails from auth.users
    const allRequests = [...(dueTomorrow || []), ...(dueToday || []), ...(overdue || [])]
    const userIds = [...new Set(allRequests.map(r => r.user_id))]

    let emailMap = new Map<string, string>()

    if (userIds.length > 0) {
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const filteredUsers = authUsers?.users.filter(u => userIds.includes(u.id)) || []
      emailMap = new Map(filteredUsers.map(u => [u.id, u.email]))
    }

    let sentCount = 0

    // Send due tomorrow emails
    for (const req_data of (dueTomorrow || [])) {
      const email = emailMap.get(req_data.user_id)
      const profile = req_data.profiles
      if (email && profile) {
        const template = EMAIL_TEMPLATES.dueTomorrow({
          email,
          fullName: profile.full_name,
          bookTitle: req_data.books.title,
          dueDate: new Date(req_data.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        })

        await sendEmail(email, template.subject, template.html)
        await supabase.from('notifications').insert({
          user_id: req_data.user_id,
          title: 'Reminder: Jatuh Tempo Besok',
          message: `Buku "${req_data.books.title}" harus dikembalikan besok.`,
          type: 'warning',
          related_request_id: req_data.id
        })
        sentCount++
      }
    }

    // Send due today emails
    for (const req_data of (dueToday || [])) {
      const email = emailMap.get(req_data.user_id)
      const profile = req_data.profiles
      if (email && profile) {
        const template = EMAIL_TEMPLATES.dueToday({
          email,
          fullName: profile.full_name,
          bookTitle: req_data.books.title,
          dueDate: new Date(req_data.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        })

        await sendEmail(email, template.subject, template.html)
        await supabase.from('notifications').insert({
          user_id: req_data.user_id,
          title: 'Jatuh Tempo Hari Ini',
          message: `Buku "${req_data.books.title}" jatuh tempo hari ini.`,
          type: 'warning',
          related_request_id: req_data.id
        })
        sentCount++
      }
    }

    // Send overdue emails
    for (const req_data of (overdue || [])) {
      const email = emailMap.get(req_data.user_id)
      const profile = req_data.profiles
      if (email && profile) {
        const dueDate = new Date(req_data.due_date)
        const overdueDays = Math.ceil((today.getTime() - dueDate.getTime()) / 86400000)

        const template = EMAIL_TEMPLATES.overdue({
          email,
          fullName: profile.full_name,
          bookTitle: req_data.books.title,
          dueDate: req_data.due_date,
          overdueDays,
          fine: req_data.fine
        })

        await sendEmail(email, template.subject, template.html)
        await supabase.from('notifications').insert({
          user_id: req_data.user_id,
          title: 'Peringatan: Buku Terlambat',
          message: `Buku "${req_data.books.title}" terlambat ${overdueDays} hari dikembalikan.`,
          type: 'error',
          related_request_id: req_data.id
        })
        sentCount++
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${sentCount} email notifications`,
      stats: {
        dueTomorrow: (dueTomorrow || []).length,
        dueToday: (dueToday || []).length,
        overdue: (overdue || []).length,
        sent: sentCount
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error in send-daily-reminders:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[DRY-RUN] Would send email to: ${to}`)
    console.log(`[DRY-RUN] Subject: ${subject}`)
    return { success: true, id: 'dry-run' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Resend API error: ${error}`)
  }

  return await response.json()
}