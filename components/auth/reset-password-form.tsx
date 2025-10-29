"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Lock, Key, ArrowLeft, AlertCircle } from "lucide-react"

interface ResetPasswordFormProps {
  email: string
  onBack: () => void
  onSuccess: () => void
}

export function ResetPasswordForm({ email, onBack, onSuccess }: ResetPasswordFormProps) {
  const [step, setStep] = useState<"token" | "password">("token")
  const [token, setToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const tokenRegex = /^[A-Z0-9]{6}$/
    if (!tokenRegex.test(token)) {
      setError("Código deve ter exatamente 6 caracteres alfanuméricos")
      setIsLoading(false)
      return
    }

    const resetDataStr = localStorage.getItem(`resetToken_${email}`)
    if (!resetDataStr) {
      setError("Sessão expirada. Solicite um novo código.")
      setIsLoading(false)
      return
    }

    const resetData = JSON.parse(resetDataStr)

    if (resetData.token !== token) {
      setError("Código inválido")
      setIsLoading(false)
      return
    }

    if (resetData.used) {
      setError("Código já foi utilizado")
      setIsLoading(false)
      return
    }

    setStep("password")
    setIsLoading(false)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          token,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || "Erro ao redefinir senha")
        setIsLoading(false)
        return
      }

      // Mark token as used
      const resetDataStr = localStorage.getItem(`resetToken_${email}`)
      if (resetDataStr) {
        const resetData = JSON.parse(resetDataStr)
        resetData.used = true
        localStorage.setItem(`resetToken_${email}`, JSON.stringify(resetData))
      }

      setIsLoading(false)
      onSuccess()
    } catch (error) {
      console.error("[v0] Error resetting password:", error)
      setError("Erro ao redefinir senha. Tente novamente.")
      setIsLoading(false)
    }
  }

  if (step === "token") {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-green-500 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white">
            <Key className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Digite o Código</h2>
          <p className="text-blue-50 mt-2">Código enviado para {email}</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleTokenSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="token" className="text-gray-700 font-medium">
                Código de Verificação
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  id="token"
                  type="text"
                  placeholder="ABC123"
                  value={token}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/[^A-Z0-9]/gi, "")
                      .toUpperCase()
                      .slice(0, 6)
                    setToken(value)
                  }}
                  className="pl-11 h-12 text-center text-lg tracking-widest font-mono uppercase border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  maxLength={6}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 text-center">Digite os 6 caracteres alfanuméricos do código</p>
            </div>

            {error && (
              <div className="flex items-start gap-3 text-sm text-red-600 bg-red-50 border border-red-200 p-4 rounded-xl">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3 h-12 rounded-xl transition-all duration-200"
              disabled={isLoading || token.length !== 6}
            >
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Verificar Código
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-gray-600 hover:text-blue-600 flex items-center justify-center gap-2 mx-auto transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-green-500 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white">
          <Lock className="h-8 w-8 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">Nova Senha</h2>
        <p className="text-blue-50 mt-2">Digite sua nova senha</p>
      </div>

      <div className="p-8">
        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-gray-700 font-medium">
              Nova Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-11 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
              Confirmar Nova Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-11 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 text-sm text-red-600 bg-red-50 border border-red-200 p-4 rounded-xl">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3 h-12 rounded-xl transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Redefinir Senha
          </Button>
        </form>
      </div>
    </div>
  )
}
