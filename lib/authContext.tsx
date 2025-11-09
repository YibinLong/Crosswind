'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { axiosInstance } from './api'
import { AuthUser, verifyToken } from '../lib/auth-client'

interface AuthContextType {
  user: AuthUser | null
  login: (emailOrToken: string, passwordOrUser: string | any) => Promise<void>
  logout: () => void
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        setUser({
          id: payload.userId,
          email: payload.email,
          role: payload.role
        })
        // Set token for API requests
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } else {
        // Invalid token, remove it
        localStorage.removeItem('auth_token')
      }
    }
    setLoading(false)
  }, [])

  const login = async (emailOrToken: string, passwordOrUser: string | any) => {
    try {
      setError(null)
      setLoading(true)

      let token: string
      let userData: any

      // Check if first parameter is a token (has JWT format) or email
      if (emailOrToken.includes('.') && emailOrToken.split('.').length === 3) {
        // Token provided directly (from API call result)
        token = emailOrToken
        userData = passwordOrUser
      } else {
        // Email and password provided, need to authenticate
        const response = await axiosInstance.post('/api/auth/login', {
          email: emailOrToken,
          password: passwordOrUser
        })

        token = response.data.token
        userData = response.data.user
      }

      // Store token
      localStorage.setItem('auth_token', token)

      // Set token for API requests
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // Update user state - extract only the fields needed for AuthUser interface
      const authUser: AuthUser = {
        id: userData.id,
        email: userData.email,
        role: userData.role
      }
      setUser(authUser)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Login failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    // Remove token
    localStorage.removeItem('auth_token')

    // Clear Authorization header
    delete axiosInstance.defaults.headers.common['Authorization']

    // Clear user state
    setUser(null)
    setError(null)
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}