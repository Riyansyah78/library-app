import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function EmailConfirmed() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [countdown, setCountdown] = useState(5)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    // Supabase otomatis handle token dari URL saat auth state change
    const handleConfirmation = async () => {
      try {
        // Cek apakah ada session (berarti email sudah terverifikasi)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Confirmation error:', error)
          setStatus('error')
          return
        }

        if (session?.user) {
          setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User')
          setStatus('success')
        } else {
          // Tunggu sebentar untuk auth state change
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            if (retrySession?.user) {
              setUserName(retrySession.user.user_metadata?.full_name || retrySession.user.email?.split('@')[0] || 'User')
              setStatus('success')
            } else {
              setStatus('success') // Tetap tampilkan sukses karena redirect dari email
            }
          }, 2000)
        }
      } catch (err) {
        console.error('Error during confirmation:', err)
        setStatus('error')
      }
    }

    handleConfirmation()
  }, [])

  // Countdown timer untuk redirect
  useEffect(() => {
    if (status !== 'success') return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [status, navigate])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #222831 0%, #393E46 50%, #222831 100%)',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle at 30% 50%, rgba(0, 173, 181, 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(148, 137, 121, 0.06) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      {/* Verifying State */}
      {status === 'verifying' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '3rem 2.5rem',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          zIndex: 1,
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #222831, #393E46)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite'
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              border: '3px solid rgba(255,255,255,0.3)',
              borderTopColor: '#00ADB5',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
          <h2 style={{
            margin: '0 0 0.75rem',
            fontSize: '1.5rem',
            color: '#222831',
            fontWeight: '700'
          }}>
            Memverifikasi Email...
          </h2>
          <p style={{
            margin: 0,
            color: '#666',
            fontSize: '1rem',
            lineHeight: '1.6'
          }}>
            Mohon tunggu sebentar, kami sedang memverifikasi akun Anda.
          </p>
        </div>
      )}

      {/* Success State */}
      {status === 'success' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '3rem 2.5rem',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          zIndex: 1,
          animation: 'fadeIn 0.5s ease-out'
        }}>
          {/* Success Icon */}
          <div style={{
            width: '90px',
            height: '90px',
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4CAF50, #45a049)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(76, 175, 80, 0.35)',
            animation: 'successBounce 0.6s ease-out'
          }}>
            <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Title */}
          <h2 style={{
            margin: '0 0 0.5rem',
            fontSize: '1.75rem',
            color: '#222831',
            fontWeight: '700'
          }}>
            Email Terverifikasi! 🎉
          </h2>

          {/* Welcome Message */}
          <p style={{
            margin: '0 0 1.5rem',
            color: '#555',
            fontSize: '1.05rem',
            lineHeight: '1.6'
          }}>
            Selamat datang{userName ? `, ${userName}` : ''}! Akun Anda telah berhasil diverifikasi dan siap digunakan.
          </p>

          {/* Feature Highlights */}
          <div style={{
            background: '#f8f9fa',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <p style={{
              margin: '0 0 0.75rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#333'
            }}>
              Hal yang bisa Anda lakukan sekarang:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { icon: '📚', text: 'Jelajahi koleksi buku perpustakaan' },
                { icon: '📖', text: 'Pinjam buku favorit Anda' },
                { icon: '⭐', text: 'Beri rating dan ulasan buku' },
                { icon: '🔔', text: 'Dapatkan notifikasi peminjaman' }
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.4rem 0',
                  fontSize: '0.9rem',
                  color: '#444'
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%',
              padding: '0.9rem',
              background: 'linear-gradient(135deg, #222831, #393E46)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.05rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(34, 40, 49, 0.3)'
            }}
            onMouseOver={e => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 6px 20px rgba(34, 40, 49, 0.4)'
            }}
            onMouseOut={e => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 15px rgba(34, 40, 49, 0.3)'
            }}
          >
            Mulai Jelajahi 📚
          </button>

          {/* Countdown */}
          <p style={{
            margin: '1rem 0 0',
            fontSize: '0.85rem',
            color: '#999'
          }}>
            Otomatis redirect dalam <span style={{
              color: '#00ADB5',
              fontWeight: '700',
              fontSize: '1rem'
            }}>{countdown}</span> detik
          </p>

          {/* Progress bar */}
          <div style={{
            marginTop: '0.75rem',
            height: '3px',
            background: '#eee',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #00ADB5, #4CAF50)',
              borderRadius: '2px',
              width: `${((5 - countdown) / 5) * 100}%`,
              transition: 'width 1s linear'
            }} />
          </div>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '3rem 2.5rem',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          zIndex: 1,
          animation: 'fadeIn 0.5s ease-out'
        }}>
          {/* Error Icon */}
          <div style={{
            width: '90px',
            height: '90px',
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f44336, #d32f2f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(244, 67, 54, 0.35)'
          }}>
            <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>

          <h2 style={{
            margin: '0 0 0.75rem',
            fontSize: '1.5rem',
            color: '#222831',
            fontWeight: '700'
          }}>
            Verifikasi Gagal
          </h2>

          <p style={{
            margin: '0 0 1.5rem',
            color: '#666',
            fontSize: '1rem',
            lineHeight: '1.6'
          }}>
            Link verifikasi mungkin sudah kadaluarsa atau tidak valid. Silakan coba daftar ulang atau minta link verifikasi baru.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/auth')}
              style={{
                flex: 1,
                padding: '0.8rem',
                background: 'linear-gradient(135deg, #222831, #393E46)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Ke Halaman Login
            </button>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes successBounce {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
