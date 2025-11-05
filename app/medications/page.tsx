"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { ArrowLeft, Heart, Plus, Pill, Tablets, Check, AlertTriangle, History } from "lucide-react"
import { getMedications, createMedication, moveMedicationToHistory, getMedicationHistory } from "@/lib/medications"

interface MedicationIntake {
  id: number
  medication_id: number
  user_id: number
  taken_at: string
  created_at: string
}

interface MedicationWithIntakes {
  id: number
  intakesToday: number
  lastIntakeTime: Date | null
  canTakeNow: boolean
  remainingToday: number
  waitHours: number
}

export default function MedicationsPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [medications, setMedications] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [medicationIntakes, setMedicationIntakes] = useState<Map<string, MedicationWithIntakes>>(new Map())
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "",
    dose: "",
    horario_uso: "",
    data_vencimento: "",
    duracao_dias: "",
    frequencia_diaria: "1",
  })
  const [error, setError] = useState("")
  const [expiryWarning, setExpiryWarning] = useState("")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth")
      return
    }
    loadMedications()
  }, [isAuthenticated, router])

  const loadIntakesForMedications = async (meds: any[]) => {
    if (!user?.id) return

    const intakesMap = new Map<string, MedicationWithIntakes>()

    for (const med of meds) {
      try {
        const response = await fetch(`/api/medications/intake?medicationId=${med.id}&userId=${user.id}`)
        const data = await response.json()

        const intakes: MedicationIntake[] = data.intakes || []
        const intakesToday = intakes.length
        const lastIntake = intakes.length > 0 ? new Date(intakes[0].taken_at) : null

        const frequencia = med.frequencia_diaria || 1
        const waitHours = Math.round(24 / frequencia)

        let canTakeNow = true
        if (lastIntake) {
          const waitTimeMs = waitHours * 60 * 60 * 1000
          const nextAllowedTime = new Date(lastIntake.getTime() + waitTimeMs)
          canTakeNow = Date.now() >= nextAllowedTime.getTime()
        }

        const remainingToday = Math.max(0, frequencia - intakesToday)

        intakesMap.set(med.id.toString(), {
          id: med.id,
          intakesToday,
          lastIntakeTime: lastIntake,
          canTakeNow,
          remainingToday,
          waitHours,
        })
      } catch (error) {
        console.error("[v0] Error loading intakes for medication:", med.id, error)
      }
    }

    setMedicationIntakes(intakesMap)
  }

  const loadMedications = async () => {
    try {
      setLoading(true)
      const loadedMedications = await getMedications()
      const loadedHistory = await getMedicationHistory()

      setMedications(Array.isArray(loadedMedications) ? loadedMedications : [])
      setHistory(Array.isArray(loadedHistory) ? loadedHistory : [])

      await loadIntakesForMedications(Array.isArray(loadedMedications) ? loadedMedications : [])

      console.log("[v0] Loaded medications:", loadedMedications)
      console.log("[v0] Loaded history:", loadedHistory)
    } catch (error) {
      console.error("[v0] Error loading medications:", error)
      setMedications([])
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === "data_vencimento") {
      const brasilNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
      const today = new Date(brasilNow)
      today.setHours(0, 0, 0, 0)

      const [year, month, day] = value.split("-")
      const expiryDate = new Date(Number(year), Number(month) - 1, Number(day))
      expiryDate.setHours(0, 0, 0, 0)

      if (expiryDate.getTime() === today.getTime()) {
        setExpiryWarning("⚠️ Atenção: Este medicamento vence hoje!")
      } else {
        setExpiryWarning("")
      }
    }
  }

  const handleEdit = (medication: any) => {
    console.log("[v0] Editing medication:", medication)
    setEditingId(medication.id)

    const dateStr = medication.data_vencimento.split("T")[0]

    setFormData({
      nome: medication.nome,
      tipo: medication.tipo,
      dose: medication.dose,
      horario_uso: medication.horario_uso,
      data_vencimento: dateStr,
      duracao_dias: medication.duracao_dias?.toString() || "",
      frequencia_diaria: medication.frequencia_diaria?.toString() || "1",
    })
    setShowForm(true)
  }

  const handleCancelMedication = async (medicationId: string) => {
    if (confirm("Tem certeza que deseja cancelar este medicamento?")) {
      try {
        console.log("[v0] Cancelling medication:", medicationId)
        const success = await moveMedicationToHistory(medicationId, "cancelado")
        if (success) {
          await loadMedications()
        } else {
          setError("Erro ao cancelar medicamento. Tente novamente.")
        }
      } catch (error) {
        console.error("[v0] Error cancelling medication:", error)
        setError("Erro ao cancelar medicamento. Tente novamente.")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const brasilNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
    const today = new Date(brasilNow)
    today.setHours(0, 0, 0, 0)

    const [year, month, day] = formData.data_vencimento.split("-")
    const expiryDate = new Date(Number(year), Number(month) - 1, Number(day))
    expiryDate.setHours(0, 0, 0, 0)

    console.log("[v0] Brasil Now:", brasilNow)
    console.log("[v0] Today:", today)
    console.log("[v0] Expiry Date:", expiryDate)

    if (expiryDate < today) {
      setError("Não é possível cadastrar medicamentos com data de vencimento passada.")
      return
    }

    if (expiryDate.getTime() === today.getTime()) {
      const [hours, minutes] = formData.horario_uso.split(":")
      const medicationTime = new Date(brasilNow)
      medicationTime.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

      if (medicationTime <= brasilNow) {
        setError("O horário de uso não pode ser menor que a hora atual.")
        return
      }
    }

    try {
      if (editingId) {
        const response = await fetch("/api/medications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            userId: user?.id,
            ...formData,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to update medication")
        }

        setEditingId(null)
      } else {
        await createMedication(formData)

        try {
          const currentUserStr = localStorage.getItem("currentUser")
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr)
            await fetch("/api/send-medication-confirmation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...formData,
                userEmail: currentUser.email,
              }),
            })
          }
        } catch (emailError) {
          console.error("[v0] Error sending confirmation email:", emailError)
        }
      }

      setFormData({
        nome: "",
        tipo: "",
        dose: "",
        horario_uso: "",
        data_vencimento: "",
        duracao_dias: "",
        frequencia_diaria: "1",
      })
      setExpiryWarning("")
      setShowForm(false)
      await loadMedications()
    } catch (error) {
      setError("Erro ao cadastrar medicamento. Tente novamente.")
    }
  }

  const handleConfirmarTomada = async (medicationId: string) => {
    if (!user?.id) return

    try {
      console.log("[v0] Recording intake for medication:", medicationId)

      const response = await fetch("/api/medications/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to record intake")
      }

      await loadMedications()

      const intakeInfo = medicationIntakes.get(medicationId.toString())
      if (intakeInfo) {
        const remaining = intakeInfo.remainingToday - 1
        if (remaining > 0) {
          alert(
            `Tomada registrada! Falta tomar esse medicamento ${remaining} ${remaining === 1 ? "vez" : "vezes"} hoje!`,
          )
        } else {
          alert("Tomada registrada! Você completou todas as doses de hoje!")
        }
      }
    } catch (error) {
      console.error("[v0] Error recording intake:", error)
      alert("Erro ao registrar tomada. Tente novamente.")
    }
  }

  const diasParaVencimento = (dataVencimento: string) => {
    const brasilNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
    const hoje = new Date(brasilNow)
    hoje.setHours(0, 0, 0, 0)

    const [year, month, day] = dataVencimento.split("T")[0].split("-")
    const vencimento = new Date(Number(year), Number(month) - 1, Number(day))
    vencimento.setHours(0, 0, 0, 0)

    const diffTime = vencimento.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const isVencido = (dataVencimento: string) => {
    return diasParaVencimento(dataVencimento) < 0
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR")
  }

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando medicamentos...</p>
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
                  Saúde Na Palma da Mão
                </h1>
              </div>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-green-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Medicamento</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Medicamentos</h2>
          <p className="text-gray-600">Controle seus medicamentos e nunca esqueça de tomar</p>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? "Editar Medicamento" : "Registrar Novo Medicamento"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Medicamento *</label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Paracetamol"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="Comprimido">Comprimido</option>
                    <option value="Cápsula">Cápsula</option>
                    <option value="Xarope">Xarope</option>
                    <option value="Gotas">Gotas</option>
                    <option value="Injeção">Injeção</option>
                    <option value="Pomada">Pomada</option>
                    <option value="Creme">Creme</option>
                    <option value="Spray">Spray</option>
                    <option value="Adesivo">Adesivo</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dose *</label>
                  <input
                    type="text"
                    name="dose"
                    value={formData.dose}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 500mg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Horário de Uso *</label>
                  <input
                    type="time"
                    name="horario_uso"
                    value={formData.horario_uso}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Vencimento *</label>
                  <input
                    type="date"
                    name="data_vencimento"
                    value={formData.data_vencimento}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Durante quantos dias? *</label>
                  <input
                    type="number"
                    name="duracao_dias"
                    value={formData.duracao_dias}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 7"
                  />
                  <p className="text-xs text-gray-500 mt-1">Número de dias do tratamento</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantas vezes por dia? *</label>
                  <input
                    type="number"
                    name="frequencia_diaria"
                    value={formData.frequencia_diaria}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="10"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Frequência diária de uso</p>
                </div>
              </div>

              {expiryWarning && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{expiryWarning}</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all"
                >
                  {editingId ? "Salvar Alterações" : "Salvar Medicamento"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData({
                      nome: "",
                      tipo: "",
                      dose: "",
                      horario_uso: "",
                      data_vencimento: "",
                      duracao_dias: "",
                      frequencia_diaria: "1",
                    })
                  }}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Medicamentos List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Medicamentos em Uso</h3>
          </div>

          <div className="p-6">
            {medications.length === 0 ? (
              <div className="text-center py-8">
                <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum medicamento registrado</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {medications.map((medicamento) => {
                  const diasVencimento = diasParaVencimento(medicamento.data_vencimento)
                  const vencido = isVencido(medicamento.data_vencimento)
                  const intakeInfo = medicationIntakes.get(medicamento.id.toString())
                  const canTake = intakeInfo?.canTakeNow ?? true
                  const remaining = intakeInfo?.remainingToday ?? medicamento.frequencia_diaria
                  const waitHours = intakeInfo?.waitHours ?? 24

                  return (
                    <div
                      key={medicamento.id}
                      className={`border rounded-xl p-6 hover:shadow-lg transition-shadow ${
                        vencido
                          ? "border-red-300 bg-red-50"
                          : diasVencimento <= 7
                            ? "border-yellow-300 bg-yellow-50"
                            : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              vencido
                                ? "bg-red-500"
                                : diasVencimento <= 7
                                  ? "bg-yellow-500"
                                  : "bg-gradient-to-r from-green-500 to-green-600"
                            }`}
                          >
                            <Tablets className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{medicamento.nome}</h4>
                            <p className="text-sm text-gray-600">{medicamento.tipo}</p>
                          </div>
                        </div>

                        {vencido ? (
                          <div className="flex items-center space-x-1 text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm font-medium">Vencido</span>
                          </div>
                        ) : diasVencimento <= 7 ? (
                          <div className="flex items-center space-x-1 text-yellow-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm font-medium">Vence em {diasVencimento} dias</span>
                          </div>
                        ) : null}
                      </div>

                      {!vencido && remaining > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium text-blue-800">
                            Falta tomar esse medicamento {remaining} {remaining === 1 ? "vez" : "vezes"} hoje!
                          </p>
                        </div>
                      )}

                      {!vencido && remaining === 0 && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-medium text-green-800">✓ Todas as doses de hoje foram tomadas!</p>
                        </div>
                      )}

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Dose:</span>
                          <span className="text-sm text-gray-600">{medicamento.dose}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Horário:</span>
                          <span className="text-sm text-gray-600">{medicamento.horario_uso}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Vencimento:</span>
                          <span className="text-sm text-gray-600">{formatDate(medicamento.data_vencimento)}</span>
                        </div>
                        {medicamento.duracao_dias && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Duração:</span>
                              <span className="text-sm text-gray-600">{medicamento.duracao_dias} dias</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Frequência:</span>
                              <span className="text-sm text-gray-600">{medicamento.frequencia_diaria}x ao dia</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => handleEdit(medicamento)}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleCancelMedication(medicamento.id)}
                          className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Cancelar
                        </button>
                      </div>

                      <button
                        onClick={() => handleConfirmarTomada(medicamento.id)}
                        disabled={vencido || !canTake}
                        className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                          vencido || !canTake
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>
                          {vencido
                            ? "Medicamento Vencido"
                            : !canTake
                              ? `Aguarde ${waitHours} ${waitHours === 1 ? "hora" : "horas"} para próxima dose`
                              : "Confirmar Tomada"}
                        </span>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Histórico de Medicamentos</h3>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Medicamento</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Dose</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Horário</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Data/Hora</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{item.nome}</td>
                        <td className="py-3 px-4 text-gray-600">{item.tipo}</td>
                        <td className="py-3 px-4 text-gray-600">{item.dose}</td>
                        <td className="py-3 px-4 text-gray-600">{item.horario_uso}</td>
                        <td className="py-3 px-4 text-gray-600">{formatDateTime(item.movido_para_historico_em)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.motivo === "completado"
                                ? "bg-green-100 text-green-700"
                                : item.motivo === "vencido"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.motivo === "completado"
                              ? "Completado"
                              : item.motivo === "vencido"
                                ? "Vencido"
                                : "Cancelado"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
