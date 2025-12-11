import React, { useEffect, useState } from 'react'
import { useAuth } from '../AuthProvider'

export default function Profile(){
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  useEffect(()=>{
    setName(user?.user_metadata?.full_name || user?.user_metadata?.full_name || '')
  },[user])

  async function onSave(e){
    e.preventDefault()
    try{
      const updates = { data: { full_name: name } }
      if(password) updates.password = password
      await updateProfile(updates)
      alert('Profil diperbarui')
      setPassword('')
    }catch(err){
      console.error(err)
      alert('Gagal update profil')
    }
  }

  if(!user) return <p>Silakan masuk untuk melihat profil.</p>

  return (
    <div style={{maxWidth:640,margin:'20px auto'}} className="card">
      <h2>Profil</h2>
      <form className="form" onSubmit={onSave}>
        <label>Nama</label>
        <input value={name} onChange={e=>setName(e.target.value)} />
        <label>Ubah Password (kosongkan jika tidak ingin mengganti)</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn" type="submit">Simpan</button>
      </form>
    </div>
  )
}
