"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { ArrowLeft, Heart, Plus, Calendar, User, MapPin, Search, History } from "lucide-react"
import { getAppointments, createAppointment, updateAppointment } from "@/lib/appointments"

export default function AppointmentsPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    tipo_consulta: "",
    nome_medico: "",
    especialidade: "",
    data_consulta: "",
    horario_consulta: "",
    local_consulta: "",
    observacoes: "",
  })
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth")
      return
    }
    loadAppointments()
  }, [isAuthenticated, router])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      console.log("[v0] Loading appointments...")
      const loadedAppointments = await getAppointments()
      console.log("[v0] Loaded appointments:", loadedAppointments)
      setAppointments(Array.isArray(loadedAppointments) ? loadedAppointments : [])
    } catch (error) {
      console.error("[v0] Error loading appointments:", error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEdit = (appointment: any) => {
    console.log("[v0] Editing appointment:", appointment)
    setEditingId(appointment.id)

    const dateStr = appointment.data_consulta.split("T")[0]

    setFormData({
      tipo_consulta: appointment.tipo_consulta,
      nome_medico: appointment.nome_medico,
      especialidade: appointment.especialidade,
      data_consulta: dateStr,
      horario_consulta: appointment.horario_consulta,
      local_consulta: appointment.local_consulta,
      observacoes: appointment.observacoes || "",
    })
    setShowForm(true)
  }

  const handleCancel = async (appointmentId: string) => {
    if (confirm("Tem certeza que deseja cancelar esta consulta?")) {
      try {
        console.log("[v0] Cancelling appointment:", appointmentId)
        await updateAppointment(appointmentId, { status: "cancelled" })
        await loadAppointments()
      } catch (error) {
        console.error("[v0] Error cancelling appointment:", error)
        setError("Erro ao cancelar consulta. Tente novamente.")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const brasilNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
    const brasilToday = new Date(brasilNow)
    brasilToday.setHours(0, 0, 0, 0)

    const [year, month, day] = formData.data_consulta.split("-")
    const appointmentDate = new Date(Number(year), Number(month) - 1, Number(day))
    appointmentDate.setHours(0, 0, 0, 0)

    const [hours, minutes] = formData.horario_consulta.split(":")
    const appointmentDateTime = new Date(appointmentDate)
    appointmentDateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

    console.log("[v0] Brasil Now:", brasilNow.toISOString())
    console.log("[v0] Brasil Today:", brasilToday.toISOString())
    console.log("[v0] Appointment Date:", appointmentDate.toISOString())
    console.log("[v0] Appointment DateTime:", appointmentDateTime.toISOString())

    if (appointmentDate < brasilToday) {
      setError("Não é possível agendar consultas em datas passadas.")
      return
    }

    if (appointmentDate.getTime() === brasilToday.getTime()) {
      const minTime = new Date(brasilNow.getTime() + 30 * 60 * 1000)
      if (appointmentDateTime < minTime) {
        setError("Consultas para hoje devem ser agendadas com pelo menos 30 minutos de antecedência.")
        return
      }
    }

    try {
      if (editingId) {
        console.log("[v0] Updating appointment:", editingId, formData)
        await updateAppointment(editingId, formData)
        setEditingId(null)
      } else {
        console.log("[v0] Creating appointment:", formData)
        await createAppointment(formData)

        try {
          const currentUserStr = localStorage.getItem("currentUser")
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr)
            await fetch("/api/send-appointment-confirmation", {
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
        tipo_consulta: "",
        nome_medico: "",
        especialidade: "",
        data_consulta: "",
        horario_consulta: "",
        local_consulta: "",
        observacoes: "",
      })
      setShowForm(false)
      await loadAppointments()
    } catch (error) {
      console.error("[v0] Error submitting appointment:", error)
      setError("Erro ao agendar consulta. Tente novamente.")
    }
  }

  const brasilNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  const brasilToday = new Date(brasilNow)
  brasilToday.setHours(0, 0, 0, 0)

  const activeAppointments = appointments.filter((appointment) => {
    if (appointment.status === "cancelled") return false

    const appointmentDate = new Date(appointment.data_consulta)
    appointmentDate.setHours(0, 0, 0, 0)

    return appointmentDate >= brasilToday
  })

  const historyAppointments = appointments.filter((appointment) => {
    if (appointment.status === "cancelled") return true

    const appointmentDate = new Date(appointment.data_consulta)
    appointmentDate.setHours(0, 0, 0, 0)

    return appointmentDate < brasilToday
  })

  const filteredActiveAppointments = activeAppointments.filter(
    (appointment) =>
      appointment.nome_medico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.especialidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.tipo_consulta?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR")
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
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
                  MedCare
                </h1>
              </div>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Consulta</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Consultas</h2>
          <p className="text-gray-600">Agende e acompanhe suas consultas médicas</p>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? "Editar Consulta" : "Agendar Nova Consulta"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Consulta *</label>
                  <select
                    name="tipo_consulta"
                    value={formData.tipo_consulta}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="Consulta de Rotina">Consulta de Rotina</option>
                    <option value="Consulta de Retorno">Consulta de Retorno</option>
                    <option value="Consulta de Urgência">Consulta de Urgência</option>
                    <option value="Exame">Exame</option>
                    <option value="Procedimento">Procedimento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Médico *</label>
                  <input
                    type="text"
                    name="nome_medico"
                    value={formData.nome_medico}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade *</label>
                  <input
                    type="text"
                    name="especialidade"
                    value={formData.especialidade}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Cardiologia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data da Consulta *</label>
                  <input
                    type="date"
                    name="data_consulta"
                    value={formData.data_consulta}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Horário *</label>
                  <input
                    type="time"
                    name="horario_consulta"
                    value={formData.horario_consulta}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Local da Consulta *</label>
                  <input
                    type="text"
                    name="local_consulta"
                    value={formData.local_consulta}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Hospital São Paulo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Informações adicionais sobre a consulta..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all"
                >
                  {editingId ? "Salvar Alterações" : "Agendar Consulta"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData({
                      tipo_consulta: "",
                      nome_medico: "",
                      especialidade: "",
                      data_consulta: "",
                      horario_consulta: "",
                      local_consulta: "",
                      observacoes: "",
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

        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por médico, especialidade ou tipo de consulta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Consultas Agendadas</h3>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando consultas...</p>
              </div>
            ) : filteredActiveAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm ? "Nenhuma consulta encontrada" : "Nenhuma consulta agendada"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActiveAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{appointment.tipo_consulta}</h4>
                          <p className="text-gray-600">{appointment.especialidade}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatDate(appointment.data_consulta)}</p>
                        <p className="text-sm text-gray-600">{appointment.horario_consulta}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{appointment.nome_medico}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{appointment.local_consulta}</span>
                      </div>
                    </div>

                    {appointment.observacoes && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700">{appointment.observacoes}</p>
                      </div>
                    )}

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleEdit(appointment)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleCancel(appointment.id)}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {historyAppointments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Histórico de Consultas</h3>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {historyAppointments.map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            appointment.status === "cancelled" ? "bg-red-500" : "bg-gray-500"
                          }`}
                        >
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{appointment.tipo_consulta}</h4>
                          <p className="text-gray-600">{appointment.especialidade}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatDate(appointment.data_consulta)}</p>
                        <p className="text-sm text-gray-600">{appointment.horario_consulta}</p>
                        <span
                          className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {appointment.status === "cancelled" ? "Cancelada" : "Realizada"}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{appointment.nome_medico}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{appointment.local_consulta}</span>
                      </div>
                    </div>

                    {appointment.observacoes && (
                      <div className="bg-white rounded-lg p-3 mt-4">
                        <p className="text-sm text-gray-700">{appointment.observacoes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
