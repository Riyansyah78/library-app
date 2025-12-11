// File: src/pages/UserManagement.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthProvider'
import { useNavigate } from 'react-router-dom'
import Popup from '../components/Popup'

export default function UserManagement() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: null
  })

  useEffect(() => {
    if (!isAdmin) {
      navigate('/')
      return
    }
    loadUsers()
  }, [isAdmin, navigate])

  async function loadUsers() {
    try {
      setLoading(true)
      
      // Gunakan RPC function untuk get all users dengan email sekaligus
      const { data, error } = await supabase
        .rpc('get_all_users_with_email')

      if (error) {
        console.error('RPC error:', error)
        // Fallback: fetch dari profiles saja tanpa email
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, is_admin, avatar_url, created_at')
          .order('created_at', { ascending: false })
        
        if (profilesError) throw profilesError
        
        // Set users tanpa email
        const usersWithoutEmail = (profilesData || []).map(p => ({
          ...p,
          email: `ID: ${p.id.substring(0, 8)}...`
        }))
        
        setUsers(usersWithoutEmail)
        showPopup('alert', 'Peringatan', 'Email tidak dapat dimuat. Pastikan RPC function sudah dibuat di Supabase.')
        return
      }

      setUsers(data || [])
    } catch (err) {
      console.error('Error loading users:', err)
      showPopup('alert', 'Error', 'Gagal memuat daftar user: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function toggleAdminStatus(userId, currentIsAdmin, userName, userEmail) {
    const action = currentIsAdmin ? 'mencabut hak admin dari' : 'memberikan hak admin kepada'
    const displayName = userName || userEmail
    
    setPopup({
      isOpen: true,
      type: 'confirm',
      title: 'Konfirmasi Perubahan',
      message: `Apakah Anda yakin ingin ${action} ${displayName}?`,
      onConfirm: () => confirmToggleAdmin(userId, currentIsAdmin, displayName)
    })
  }

  async function confirmToggleAdmin(userId, currentIsAdmin, displayName) {
    try {
      const newStatus = !currentIsAdmin
      
      // Update di table profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_admin: newStatus })
        .eq('id', userId)

      if (profileError) throw profileError

      // Update di auth.users metadata juga
      try {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          userId,
          {
            user_metadata: { is_admin: newStatus }
          }
        )
        
        if (authError) {
          console.warn('Could not update auth metadata:', authError)
          // Tidak throw error karena update profiles sudah berhasil
        }
      } catch (authErr) {
        console.warn('Auth metadata update failed:', authErr)
      }

      showPopup('alert', 'Berhasil', 
        `Hak admin ${newStatus ? 'diberikan kepada' : 'dicabut dari'} ${displayName}`)
      
      await loadUsers()
    } catch (err) {
      console.error('Error updating admin status:', err)
      showPopup('alert', 'Error', 
        'Gagal mengubah status admin: ' + err.message)
    }
  }

  async function deleteUser(userId, userName, userEmail) {
    const displayName = userName || userEmail
    
    setPopup({
      isOpen: true,
      type: 'alert',
      title: 'Fitur Tidak Tersedia',
      message: 'Hapus user hanya bisa dilakukan melalui Supabase Dashboard untuk keamanan. Silakan akses Supabase Dashboard → Authentication → Users untuk menghapus user.'
    })
  }

  async function confirmDeleteUser(userId, displayName) {
    // Fungsi ini tidak akan dipanggil karena delete user disabled
    // Keeping for backward compatibility
    try {
      showPopup('alert', 'Info', 'Fitur hapus user tidak tersedia di client-side.')
    } catch (err) {
      console.error('Error deleting user:', err)
      showPopup('alert', 'Error', 'Gagal menghapus user: ' + err.message)
    }
  }

  function showPopup(type, title, message, onConfirm = null) {
    setPopup({
      isOpen: true,
      type,
      title,
      message,
      onConfirm
    })
  }

  function closePopup() {
    setPopup({ ...popup, isOpen: false })
  }

  // Filter users berdasarkan search
  const filteredUsers = users.filter(u => 
    (u.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (!isAdmin) {
    return (
      <div className="card">
        <p className="text-center" style={{ color: '#f44336' }}>
          Anda tidak memiliki akses ke halaman ini.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>
          Manajemen Pengguna
        </h2>
        <button 
          className="btn-ghost" 
          onClick={loadUsers}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <input 
          type="text"
          placeholder="Cari user berdasarkan email atau nama..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem'
          }}
        />
      </div>

      {/* User List */}
      <div className="card">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
            Daftar Pengguna ({filteredUsers.length})
          </h3>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Admin: {users.filter(u => u.is_admin).length} | 
            User: {users.filter(u => !u.is_admin).length}
          </div>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '1rem', color: '#666' }}>Memuat data...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            {searchTerm ? 'Tidak ada user yang cocok dengan pencarian' : 'Tidak ada user yang ditemukan'}
          </p>
        ) : (
          <div>
            {filteredUsers.map(u => (
              <div key={u.id} className="request-row">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '1rem' }}>{u.email}</strong>
                    {u.is_admin && (
                      <span style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        ADMIN
                      </span>
                    )}
                    {u.id === user?.id && (
                      <span style={{
                        backgroundColor: '#2196F3',
                        color: 'white',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        YOU
                      </span>
                    )}
                  </div>
                  
                  {u.full_name && (
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: '#666',
                      marginTop: '0.25rem'
                    }}>
                      {u.full_name}
                    </div>
                  )}
                  
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#999',
                    marginTop: '0.25rem'
                  }}>
                    Bergabung: {new Date(u.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                
                <div className="actions">
                  {u.id !== user?.id ? (
                    <>
                      <button 
                        className={u.is_admin ? 'btn-ghost' : 'btn'}
                        onClick={() => toggleAdminStatus(
                          u.id, 
                          u.is_admin || false,
                          u.full_name,
                          u.email
                        )}
                        style={{
                          backgroundColor: u.is_admin ? 'transparent' : '#4CAF50',
                          borderColor: u.is_admin ? '#f44336' : '#4CAF50',
                          color: u.is_admin ? '#f44336' : 'white'
                        }}
                      >
                        {u.is_admin ? '❌ Cabut Admin' : '✓ Jadikan Admin'}
                      </button>
                    </>
                  ) : (
                    <span style={{ 
                      fontSize: '0.9rem', 
                      color: '#999',
                      fontStyle: 'italic'
                    }}>
                      (Akun Anda)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#f8f9fa' }}>
        <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>ℹ️ Informasi</h3>
        <ul style={{ 
          margin: 0, 
          paddingLeft: '1.5rem',
          fontSize: '0.9rem',
          color: '#666',
          lineHeight: '1.8'
        }}>
          <li>Admin dapat mengakses halaman admin dan mengelola buku</li>
          <li>Admin dapat memberikan atau mencabut hak admin dari user lain</li>
          <li>Anda tidak dapat mengubah status admin Anda sendiri</li>
        </ul>

      </div>

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