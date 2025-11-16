"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { ArrowLeft, Heart, User, Save, Loader2 } from "lucide-react"
import { formatCPF, formatCEP, formatPhone } from "@/lib/format-utils"

export default function ProfilePage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    data_nascimento: "",
    cpf: "",
    endereco_rua: "",
    endereco_numero: "",
    endereco_complemento: "",
    endereco_bairro: "",
    endereco_cidade: "",
    endereco_estado: "",
    endereco_cep: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingCep, setLoadingCep] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    console.log("[v0] ProfilePage mounted, isAuthenticated:", isAuthenticated, "user:", user)

    if (!isAuthenticated) {
      console.log("[v0] User not authenticated, redirecting to /auth")
      router.push("/auth")
      return
    }

    if (!user?.id) {
      console.log("[v0] User ID not available yet")
      return
    }

    loadUserProfile()
  }, [isAuthenticated, user, router])

  const loadUserProfile = async () => {
    if (!user?.id) {
      console.log("[v0] Cannot load profile: user.id is undefined")
      return
    }

    try {
      setLoadingProfile(true)
      console.log("[v0] Loading user profile from database for userId:", user.id)

      const response = await fetch(`/api/user/profile?userId=${user.id}`)
      console.log("[v0] Profile API response status:", response.status)

      const data = await response.json()
      console.log("[v0] Profile API response data:", data)

      if (data.user) {
        console.log("[v0] User profile loaded successfully:", data.user)

        let formattedDate = ""
        if (data.user.data_nascimento) {
          const date = new Date(data.user.data_nascimento)
          formattedDate = date.toISOString().split("T")[0]
        }

        setFormData({
          nome_completo: data.user.nome_completo || "",
          email: data.user.email || "",
          telefone: formatPhone(data.user.telefone || ""),
          data_nascimento: formattedDate,
          cpf: formatCPF(data.user.cpf || ""),
          endereco_rua: data.user.endereco_rua || "",
          endereco_numero: data.user.endereco_numero || "",
          endereco_complemento: data.user.endereco_complemento || "",
          endereco_bairro: data.user.endereco_bairro || "",
          endereco_cidade: data.user.endereco_cidade || "",
          endereco_estado: data.user.endereco_estado || "",
          endereco_cep: formatCEP(data.user.endereco_cep || ""),
        })
        console.log("[v0] Form data set successfully")
      } else {
        console.log("[v0] No user data in response")
        setMessage("Erro ao carregar perfil. Dados não encontrados.")
      }
    } catch (error) {
      console.error("[v0] Error loading user profile:", error)
      setMessage("Erro ao carregar perfil. Tente novamente.")
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    let formattedValue = value

    if (name === "telefone") {
      formattedValue = formatPhone(value)
    } else if (name === "endereco_cep") {
      formattedValue = formatCEP(value)
      if (formattedValue.replace(/\D/g, "").length === 8) {
        fetchAddressByCep(formattedValue.replace(/\D/g, ""))
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }))
  }

  const fetchAddressByCep = async (cep: string) => {
    if (cep.length !== 8) return

    setLoadingCep(true)
    try {
      console.log("[v0] Fetching address for CEP:", cep)
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        console.log("[v0] Address fetched successfully:", data)
        setFormData((prev) => ({
          ...prev,
          endereco_rua: data.logradouro || prev.endereco_rua,
          endereco_bairro: data.bairro || prev.endereco_bairro,
          endereco_cidade: data.localidade || prev.endereco_cidade,
          endereco_estado: data.uf || prev.endereco_estado,
        }))
      } else {
        console.log("[v0] CEP not found")
      }
    } catch (error) {
      console.error("[v0] Error fetching CEP:", error)
    } finally {
      setLoadingCep(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      console.log("[v0] Cannot submit: user.id is undefined")
      setMessage("❌ Erro: usuário não identificado. Faça login novamente.")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      console.log("[v0] Updating user profile for userId:", user.id)

      const updateData = {
        userId: user.id,
        nome_completo: formData.nome_completo,
        email: formData.email,
        telefone: formData.telefone.replace(/\D/g, ""),
        endereco_rua: formData.endereco_rua,
        endereco_numero: formData.endereco_numero,
        endereco_complemento: formData.endereco_complemento,
        endereco_bairro: formData.endereco_bairro,
        endereco_cidade: formData.endereco_cidade,
        endereco_estado: formData.endereco_estado,
        endereco_cep: formData.endereco_cep.replace(/\D/g, ""),
      }

      console.log("[v0] Form data being sent:", updateData)

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      console.log("[v0] Update API response status:", response.status)
      const data = await response.json()
      console.log("[v0] Update API response data:", data)

      if (response.ok) {
        console.log("[v0] Profile updated successfully")
        setMessage("✅ Perfil atualizado com sucesso!")

        setTimeout(() => {
          console.log("[v0] Reloading profile after update")
          loadUserProfile()
        }, 1000)
      } else {
        console.error("[v0] Error response from API:", data)
        throw new Error(data.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
      setMessage("❌ Erro ao atualizar perfil. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated || !user) {
    console.log("[v0] Not rendering profile: not authenticated or no user")
    return null
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  Saúde Na Palma da Mão
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil</h2>
          <p className="text-gray-600">Atualize suas informações pessoais</p>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Informações Pessoais</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
                <input
                  type="text"
                  name="nome_completo"
                  value={formData.nome_completo}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 cursor-not-allowed text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">O CPF não pode ser alterado</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento</label>
                <input
                  type="date"
                  name="data_nascimento"
                  value={formData.data_nascimento}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 cursor-not-allowed text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">A data de nascimento não pode ser alterada</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                <div className="relative">
                  <input
                    type="text"
                    name="endereco_cep"
                    value={formData.endereco_cep}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {loadingCep && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">O endereço será preenchido automaticamente</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rua</label>
                <input
                  type="text"
                  name="endereco_rua"
                  value={formData.endereco_rua}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                <input
                  type="text"
                  name="endereco_numero"
                  value={formData.endereco_numero}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                <input
                  type="text"
                  name="endereco_complemento"
                  value={formData.endereco_complemento}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                <input
                  type="text"
                  name="endereco_bairro"
                  value={formData.endereco_bairro}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                <input
                  type="text"
                  name="endereco_cidade"
                  value={formData.endereco_cidade}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <input
                  type="text"
                  name="endereco_estado"
                  value={formData.endereco_estado}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.includes("sucesso")
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isLoading ? "Salvando..." : "Salvar Alterações"}</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
