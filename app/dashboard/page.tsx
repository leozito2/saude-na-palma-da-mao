"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Heart, Calendar, Pill, User, LogOut } from "lucide-react"
import { getAppointments } from "@/lib/appointments"
import { getMedications } from "@/lib/medications"

export default function DashboardPage() {
  const { isAuthenticated, user, logout } = useAuth()
  const router = useRouter()
  const [appointments, setAppointments] = useState<any[]>([])
  const [medications, setMedications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth")
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        const [loadedAppointments, loadedMedications] = await Promise.all([getAppointments(), getMedications()])

        console.log("[v0] Loaded appointments:", loadedAppointments)
        console.log("[v0] Loaded medications:", loadedMedications)

        // Ensure we always have arrays
        setAppointments(Array.isArray(loadedAppointments) ? loadedAppointments : [])
        setMedications(Array.isArray(loadedMedications) ? loadedMedications : [])
      } catch (error) {
        console.error("[v0] Error loading data:", error)
        setAppointments([])
        setMedications([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  const navigate = (path: string) => {
    router.push(path)
  }

  const profile = {
    nome_completo: user.nome_completo || "Usuário",
  }

  const getProximasConsultas = () => {
    const brasilNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
    const today = new Date(brasilNow)
    today.setHours(0, 0, 0, 0)

    console.log("[v0] Total appointments:", appointments.length)
    console.log("[v0] Appointments data:", appointments)

    if (!Array.isArray(appointments)) {
      console.error("[v0] Appointments is not an array:", appointments)
      return []
    }

    const futureAppointments = appointments
      .filter((apt) => {
        const aptDate = new Date(apt.data_consulta)
        aptDate.setHours(0, 0, 0, 0)
        const isFuture = aptDate >= today
        console.log("[v0] Appointment:", apt.data_consulta, "Is future:", isFuture)
        return isFuture
      })
      .sort((a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime())
      .slice(0, 2)

    console.log("[v0] Future appointments:", futureAppointments)
    return futureAppointments
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const dashboardStats = {
    proximasConsultas: getProximasConsultas().length,
    medicamentosAtivos: medications.length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
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

            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{profile.nome_completo}</p>
                <p className="text-xs text-gray-600">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo, {profile.nome_completo.split(" ")[0]}!</h2>
          <p className="text-gray-600">Gerencie sua saúde de forma simples e organizada</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{dashboardStats.proximasConsultas}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Próximas Consultas</h3>
            <p className="text-sm text-gray-600">Consultas agendadas</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{dashboardStats.medicamentosAtivos}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Medicamentos</h3>
            <p className="text-sm text-gray-600">Em uso atualmente</p>
          </div>
        </div>

        {/* Quick Access to Today's Schedule */}
        {getProximasConsultas().length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Próximas Consultas</h3>
            <div className="space-y-3">
              {getProximasConsultas().map((consulta) => (
                <div key={consulta.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{consulta.tipo_consulta}</p>
                    <p className="text-sm text-gray-600">{consulta.nome_medico}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatDate(consulta.data_consulta)}</p>
                    <p className="text-sm text-gray-600">{consulta.horario_consulta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Manage Appointments */}
          <div
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 cursor-pointer"
            onClick={() => navigate("/appointments")}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Gerenciar Consultas</h3>
            <p className="text-gray-600 mb-4">Agende, visualize e gerencie suas consultas médicas</p>
            <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
              Acessar módulo →
            </button>
          </div>

          {/* Manage Medications */}
          <div
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 cursor-pointer"
            onClick={() => navigate("/medications")}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Medicamentos</h3>
            <p className="text-gray-600 mb-4">Controle seus medicamentos e receba lembretes</p>
            <button className="text-green-600 font-medium hover:text-green-700 transition-colors">
              Acessar módulo →
            </button>
          </div>

          {/* Profile Settings */}
          <div
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 cursor-pointer"
            onClick={() => navigate("/profile")}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Meu Perfil</h3>
            <p className="text-gray-600 mb-4">Atualize suas informações pessoais</p>
            <button className="text-purple-600 font-medium hover:text-purple-700 transition-colors">
              Editar perfil →
            </button>
          </div>
        </div>

        {/* Recent Medications */}
        {medications.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Medicamentos Recentes</h3>
              <button
                onClick={() => navigate("/medications")}
                className="text-green-600 font-medium hover:text-green-700 transition-colors"
              >
                Ver todos →
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medications.slice(0, 3).map((medicamento) => (
                <div key={medicamento.id} className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <Pill className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{medicamento.nome}</p>
                      <p className="text-sm text-gray-600">{medicamento.dose}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Horário: {medicamento.horario_uso}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sistema Completo Notice */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white">
          <div className="text-center">
            <Heart className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Sistema MedCare Completo</h3>
            <p className="text-blue-100 mb-6">
              Todos os módulos estão funcionais! Gerencie suas consultas, controle seus medicamentos e mantenha sua
              saúde organizada.
            </p>
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <h4 className="font-semibold mb-1">✅ Módulo de Consultas</h4>
                <p className="text-sm text-blue-100">Registro, visualização e busca completos</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <h4 className="font-semibold mb-1">✅ Módulo de Medicamentos</h4>
                <p className="text-sm text-blue-100">Controle e confirmação de medicações</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
