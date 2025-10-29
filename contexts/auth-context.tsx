"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { type AuthState, authService } from "@/lib/auth"

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (userData: {
    nome_completo: string
    email: string
    password: string
    cpf: string
    sexo: string
    endereco_completo: string
    data_nascimento: string
  }) => Promise<{
    success: boolean
    error?: string
  }>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updateUser: (userData: {
    nome_completo: string
    email: string
    telefone?: string
    data_nascimento?: string
    endereco?: string
    cidade?: string
    estado?: string
    cep?: string
  }) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  })

  useEffect(() => {
    // Check for existing user on mount
    const user = authService.getCurrentUser()
    if (user) {
      setAuthState({ user, isAuthenticated: true })
    }
  }, [])

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password)
    if (result.success && result.user) {
      setAuthState({ user: result.user, isAuthenticated: true })
    }
    return result
  }

  const register = async (userData: {
    nome_completo: string
    email: string
    password: string
    cpf: string
    sexo: string
    endereco_completo: string
    data_nascimento: string
  }) => {
    const result = await authService.register(userData)
    if (result.success && result.user) {
      setAuthState({ user: result.user, isAuthenticated: true })
    }
    return result
  }

  const logout = async () => {
    await authService.logout()
    setAuthState({ user: null, isAuthenticated: false })
  }

  const resetPassword = async (email: string) => {
    return await authService.resetPassword(email)
  }

  const updateUser = async (userData: {
    nome_completo: string
    email: string
    telefone?: string
    data_nascimento?: string
    endereco?: string
    cidade?: string
    estado?: string
    cep?: string
  }) => {
    const result = await authService.updateUser(userData)
    if (result.success && result.user) {
      setAuthState({ user: result.user, isAuthenticated: true })
    }
    return result
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        resetPassword,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
