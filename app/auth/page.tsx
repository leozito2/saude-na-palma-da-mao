"use client"

import { useState } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Heart } from "lucide-react"

type AuthMode = "login" | "register" | "forgot-password"

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login")
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  if (isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                MedCare
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-12 px-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {mode === "login" && "Bem-vindo de volta"}
              {mode === "register" && "Crie sua conta"}
              {mode === "forgot-password" && "Recuperar senha"}
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              {mode === "login" && "Entre na sua conta para gerenciar sua saúde"}
              {mode === "register" && "Junte-se ao MedCare e cuide melhor da sua saúde"}
              {mode === "forgot-password" && "Digite seu email para recuperar o acesso"}
            </p>
          </div>

          {mode === "login" && (
            <LoginForm onToggleMode={() => setMode("register")} onForgotPassword={() => setMode("forgot-password")} />
          )}

          {mode === "register" && <RegisterForm onToggleMode={() => setMode("login")} />}

          {mode === "forgot-password" && <ForgotPasswordForm onBack={() => setMode("login")} />}
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold">MedCare</h3>
            </div>
            <p className="text-gray-400">© 2025 MedCare. Cuidando da sua saúde com tecnologia.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
