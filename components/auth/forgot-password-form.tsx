"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResetPasswordForm } from "./reset-password-form"
import { Loader2, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"

interface ForgotPasswordFormProps {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<"email" | "reset" | "success">("email")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/send-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.status === 404) {
        setError(data.error || "Email não encontrado no sistema")
        setIsLoading(false)
        return
      }

      if (response.ok && data.success) {
        if (data.resetData) {
          localStorage.setItem("currentResetEmail", email)
          localStorage.setItem(`resetToken_${email}`, JSON.stringify(data.resetData))
        }

        if (data.testMode) {
          alert(data.message)
        }

        setStep("reset")
      } else {
        setError(data.error || "Erro ao enviar email de recuperação")
      }
    } catch (err) {
      console.error("[v0] Error sending reset email:", err)
      setError("Erro ao conectar com o servidor")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSuccess = () => {
    setStep("success")
  }

  if (step === "success") {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-green-500 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Senha Redefinida!</h2>
        </div>
        <div className="p-8">
          <p className="text-gray-600 text-center mb-6">
            Sua senha foi redefinida com sucesso. Você já pode fazer login com a nova senha.
          </p>
          <Button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3 rounded-xl transition-all duration-200"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    )
  }

  if (step === "reset") {
    return <ResetPasswordForm email={email} onBack={() => setStep("email")} onSuccess={handleResetSuccess} />
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-green-500 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white">
          <Mail className="h-8 w-8 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">Recuperar Senha</h2>
        <p className="text-blue-50 mt-2">Digite seu email para receber um código de recuperação</p>
      </div>

      <div className="p-8">
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            Enviar Código
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-600 hover:text-blue-600 flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </button>
        </div>
      </div>
    </div>
  )
}
