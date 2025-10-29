"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Mail, Lock } from "lucide-react"

interface LoginFormProps {
  onToggleMode: () => void
  onForgotPassword: () => void
}

export function LoginForm({ onToggleMode, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const result = await login(email, password)

    if (!result.success) {
      setError(result.error || "Erro ao fazer login")
    }

    setIsLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100 w-full max-w-md mx-auto">
      <div className="space-y-1 text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900">Entrar na sua conta</h3>
        <p className="text-gray-600">Digite suas credenciais para acessar o sistema</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 py-3 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 font-medium">
            Senha
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 py-3 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Entrar
        </Button>
      </form>

      <div className="mt-8 space-y-4">
        <button
          type="button"
          onClick={onForgotPassword}
          className="w-full text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
        >
          Esqueceu sua senha?
        </button>

        <div className="text-center text-sm text-gray-600">
          Não tem uma conta?{" "}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
          >
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  )
}
