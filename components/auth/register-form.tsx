"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { formatCPF, formatCEP, formatPhone } from "@/lib/format-utils"

interface RegisterFormProps {
  onToggleMode: () => void
}

export function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    nome_completo: "",
    email: "",
    password: "",
    confirmPassword: "",
    cpf: "",
    sexo: "Masculino",
    telefone: "",
    endereco_rua: "",
    endereco_numero: "",
    endereco_complemento: "",
    endereco_bairro: "",
    endereco_cidade: "",
    endereco_estado: "",
    endereco_cep: "",
    data_nascimento: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [loadingCep, setLoadingCep] = useState(false)

  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      setIsLoading(false)
      return
    }

    const result = await register({
      nome_completo: formData.nome_completo,
      email: formData.email,
      password: formData.password,
      cpf: formData.cpf,
      sexo: formData.sexo,
      endereco_completo: `${formData.endereco_rua}, ${formData.endereco_numero}, ${formData.endereco_complemento}, ${formData.endereco_bairro}, ${formData.endereco_cidade}, ${formData.endereco_estado}, ${formData.endereco_cep}`,
      data_nascimento: formData.data_nascimento,
    })

    if (!result.success) {
      setError(result.error || "Erro ao criar conta")
    }

    setIsLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    let formattedValue = value

    if (name === "cpf") {
      formattedValue = formatCPF(value)
      if (formattedValue.replace(/\D/g, "").length > 11) return
    } else if (name === "endereco_cep") {
      formattedValue = formatCEP(value)
      if (formattedValue.replace(/\D/g, "").length === 8) {
        fetchAddressByCep(formattedValue.replace(/\D/g, ""))
      }
    } else if (name === "telefone") {
      formattedValue = formatPhone(value)
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }))
  }

  const fetchAddressByCep = async (cep: string) => {
    if (cep.length !== 8) return

    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          endereco_rua: data.logradouro || prev.endereco_rua,
          endereco_bairro: data.bairro || prev.endereco_bairro,
          endereco_cidade: data.localidade || prev.endereco_cidade,
          endereco_estado: data.uf || prev.endereco_estado,
        }))
      }
    } catch (error) {
      console.error("[v0] Error fetching CEP:", error)
    } finally {
      setLoadingCep(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100 w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Criar Conta - MedCare</h3>
        <p className="text-gray-600">Preencha seus dados para começar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email & Senha */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="seu@email.com"
              required
              className="w-full border border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Mínimo 6 caracteres"
              required
              className="w-full border border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            />
          </div>
        </div>

        {/* Informações pessoais */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Informações Pessoais</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nome completo</label>
              <input
                type="text"
                name="nome_completo"
                value={formData.nome_completo}
                onChange={handleInputChange}
                placeholder="Seu nome completo"
                required
                className="w-full border border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sexo</label>
              <select
                name="sexo"
                value={formData.sexo}
                onChange={handleInputChange}
                className="w-full border border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              >
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data de nascimento</label>
              <input
                type="date"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">CPF</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
                placeholder="000.000.000-00"
                required
                maxLength={14}
                className="w-full border border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Contato</h4>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Telefone</label>
            <input
              type="text"
              name="telefone"
              value={formData.telefone}
              onChange={handleInputChange}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className="w-full border border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            />
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Endereço</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Rua</label>
              <input
                type="text"
                name="endereco_rua"
                value={formData.endereco_rua}
                onChange={handleInputChange}
                placeholder="Nome da rua"
                required
                className="w-full border border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Número</label>
              <input
                type="text"
                name="endereco_numero"
                value={formData.endereco_numero}
                onChange={handleInputChange}
                placeholder="123"
                required
                className="w-full border border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Complemento</label>
              <input
                type="text"
                name="endereco_complemento"
                value={formData.endereco_complemento}
                onChange={handleInputChange}
                placeholder="Apto, casa, etc."
                className="w-full border border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Bairro</label>
              <input
                type="text"
                name="endereco_bairro"
                value={formData.endereco_bairro}
                onChange={handleInputChange}
                placeholder="Nome do bairro"
                required
                className="w-full border border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Cidade</label>
              <input
                type="text"
                name="endereco_cidade"
                value={formData.endereco_cidade}
                onChange={handleInputChange}
                placeholder="Nome da cidade"
                required
                className="w-full border border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <input
                type="text"
                name="endereco_estado"
                value={formData.endereco_estado}
                onChange={handleInputChange}
                placeholder="SP"
                maxLength={2}
                required
                className="w-full border border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">CEP</label>
              <div className="relative">
                <input
                  type="text"
                  name="endereco_cep"
                  value={formData.endereco_cep}
                  onChange={handleInputChange}
                  placeholder="00000-000"
                  required
                  maxLength={9}
                  className="w-full border border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                />
                {loadingCep && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">O endereço será preenchido automaticamente</p>
            </div>
          </div>
        </div>

        {/* Confirmar senha */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Confirmar senha</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Digite a senha novamente"
            required
            className="w-full border border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
          />
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">{error}</div>}

        <button
          type="submit"
          className="w-full flex justify-center items-center space-x-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar conta
        </button>

        <div className="text-center">
          <div className="text-sm text-gray-600">
            Já tem uma conta?{" "}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
            >
              Faça login
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
