import React, { useState } from 'react'
import { useAuth } from '../AuthProvider'
import { useNavigate } from 'react-router-dom'
import Popup from '../components/Popup'

export default function AuthPage(){
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Perbaiki state popup - pastikan struktur yang benar
  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: ''
  })
  
  const { signUp, signIn } = useAuth()
  const navigate = useNavigate()

  async function onSubmit(e){
    e.preventDefault()
    
    // Reset popup state
    setPopup(prev => ({ ...prev, isOpen: false }))
    setLoading(true)
    
    try{
      if(mode === 'signup'){
        const { data, error: signUpError } = await signUp(email, password, { data: { full_name: name } })
        
        if (signUpError) {
          throw signUpError
        }
        
        setPopup({
          isOpen: true,
          type: 'alert',
          title: 'Berhasil',
          message: 'Registrasi sukses! Anda sudah dapat masuk.'
        })
        setMode('signin')
        setName('')
        setEmail('')
        setPassword('')
      } else {
        const { data, error: signInError } = await signIn(email, password)
        
        if (signInError) {
          throw signInError
        }
        
        navigate('/')
      }
    }catch(err){
      console.error('Auth error:', err)
      
      let errorMessage = err.message || 'Gagal autentikasi. Silakan coba lagi.'
      
      if (err.message && (err.message.includes('Invalid login credentials') || err.message.includes('Invalid credentials'))) {
        errorMessage = 'Email atau password salah.'
      } else if (err.message && err.message.includes('already registered')) {
        errorMessage = 'Email ini sudah terdaftar. Silakan masuk dengan email tersebut.'
      }
      
      setPopup({
        isOpen: true,
        type: 'alert',
        title: 'Error',
        message: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  function closePopup() {
    setPopup(prev => ({
      ...prev,
      isOpen: false
    }))
  }

  return (
    <div className="card" style={{maxWidth:480,margin:'20px auto'}}>
      <h2>{mode === 'signup' ? 'Sign Up' : 'Sign In'}</h2>
      
      <form onSubmit={onSubmit} className="form">
        {mode === 'signup' && (
          <input 
            placeholder="Nama lengkap" 
            value={name} 
            onChange={e=>setName(e.target.value)} 
            required 
            disabled={loading}
          />
        )}
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e=>setEmail(e.target.value)} 
          required 
          disabled={loading}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e=>setPassword(e.target.value)} 
          required 
          disabled={loading}
        />
        <button 
          className="btn w-full" 
          type="submit" 
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Memproses...' : (mode === 'signup' ? 'Daftar' : 'Masuk')}
        </button>
      </form>
      
      <p style={{marginTop:12, textAlign: 'center'}}>
        {mode === 'signup' ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
        <button 
          className="btn-ghost" 
          onClick={()=> {
            setMode(mode === 'signup' ? 'signin' : 'signup')
            setPopup(prev => ({ ...prev, isOpen: false }))
          }}
          disabled={loading}
        >
          {mode === 'signup' ? 'Masuk' : 'Daftar'}
        </button>
      </p>

      {/* Popup Component */}
      <Popup
        isOpen={popup.isOpen}
        onClose={closePopup}
        title={popup.title}
        message={popup.message}
        type={popup.type}
      />
    </div>
  )
}