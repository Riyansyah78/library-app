import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, fetchUserBorrowRequests } from './supabaseClient'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notificationCount, setNotificationCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.email)
        const currentUser = session?.user || null
        setUser(currentUser)
        
        // Update notifikasi dan admin status saat auth berubah
        if (currentUser) {
          updateNotificationCount(currentUser.id)
          checkAdminStatus(currentUser.id)
        } else {
          setNotificationCount(0)
          setIsAdmin(false)
        }
        
        setLoading(false)
      }
    )

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null
      setUser(currentUser)
      if (currentUser) {
        updateNotificationCount(currentUser.id)
        checkAdminStatus(currentUser.id)
      }
      setLoading(false)
    })

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [])

  const checkAdminStatus = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
        return
      }
      setIsAdmin(data?.is_admin || false)
    } catch (err) {
      console.error('checkAdminStatus error:', err)
      setIsAdmin(false)
    }
  }

  const updateNotificationCount = async (userId) => {
    try {
      const requests = await fetchUserBorrowRequests(userId)
      const today = new Date()
      let count = 0

      requests.forEach(req => {
        const dueDate = new Date(req.due_date)
        const diffTime = dueDate - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        
        
        if (req.status === 'approved') {
          
          
          if (diffDays <= 3) {
             
          }
        } else if (req.status === 'rejected') {
          count++
        }
      })
      
      setNotificationCount(count)
    } catch (err) {
      console.error('Error fetching notification count:', err)
    }
  }

  const signUp = async (email, password, options = {}) => {
    console.log('Signing up with:', email)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: options.data?.full_name || '',
          ...options.data
        },
       
      }
    })

    if (error) {
      console.error('Sign up error:', error)
      throw error
    }
    if (data.user) {
    setUser(data.user)
  }

    return { user: data.user, session: data.session }
  }

  const signIn = async (email, password) => {
    console.log('Signing in with:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign in error:', error)
      throw error
    }

    return { user: data.user, session: data.session }
  }

  const signout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
    setUser(null)
  }

  const updateProfile = async (updates) => {
    const { data, error } = await supabase.auth.updateUser(updates)
    if (error) {
      console.error('Update profile error:', error)
      throw error
    }
    setUser(data.user)
    return data
  }

  const resendConfirmation = async (email) => {
    console.log('Resending confirmation to:', email)
    
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })
    
    if (error) {
      console.error('Resend confirmation error:', error)
      throw error
    }

    return { success: true, data }
  }

  // Definisikan value dengan benar
 const authContextValue = {
  user,
  loading,
  signUp,
  signIn,
  notificationCount,
  updateNotificationCount,
  signout,
  updateProfile,
  resendConfirmation,
  isAdmin
}

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  )
}