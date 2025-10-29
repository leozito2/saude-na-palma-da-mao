"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { appointmentsService, type Appointment } from "@/lib/appointments"
import { useAuth } from "@/contexts/auth-context"
import { Calendar, Clock, User, Stethoscope, MapPin, Search, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AppointmentsListProps {
  onNewAppointment: () => void
}

export function AppointmentsList({ onNewAppointment }: AppointmentsListProps) {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [searchCpf, setSearchCpf] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const loadAppointments = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const userAppointments = await appointmentsService.getByUserId(user.id)
      setAppointments(userAppointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    } catch (error) {
      console.error("Error loading appointments:", error)
    }
    setIsLoading(false)
  }

  const handleSearch = async () => {
    if (!user || !searchCpf.trim()) {
      loadAppointments()
      return
    }

    setIsLoading(true)
    try {
      const searchResults = await appointmentsService.searchByCpf(searchCpf.trim(), user.id)
      setAppointments(searchResults.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    } catch (error) {
      console.error("Error searching appointments:", error)
    }
    setIsLoading(false)
  }

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment["status"]) => {
    try {
      await appointmentsService.update(appointmentId, { status: newStatus })
      loadAppointments()
    } catch (error) {
      console.error("Error updating appointment:", error)
    }
  }

  const handleDelete = async (appointmentId: string) => {
    if (confirm("Tem certeza que deseja excluir esta consulta?")) {
      try {
        await appointmentsService.delete(appointmentId)
        loadAppointments()
      } catch (error) {
        console.error("Error deleting appointment:", error)
      }
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [user])

  const getStatusColor = (status: Appointment["status"]) => {
    switch (status) {
      case "scheduled":
        return "bg-accent text-accent-foreground"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "cancelled":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusText = (status: Appointment["status"]) => {
    switch (status) {
      case "scheduled":
        return "Agendada"
      case "completed":
        return "Realizada"
      case "cancelled":
        return "Cancelada"
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold text-primary">Consultas Médicas</CardTitle>
              <CardDescription>Gerencie suas consultas agendadas</CardDescription>
            </div>
            <Button onClick={onNewAppointment} className="sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova Consulta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por CPF do paciente..."
                value={searchCpf}
                onChange={(e) => setSearchCpf(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              Buscar
            </Button>
            <Button onClick={loadAppointments} variant="outline">
              Limpar
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando consultas...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchCpf ? "Nenhuma consulta encontrada para este CPF" : "Nenhuma consulta agendada"}
            </div>
          ) : (
            <div className="grid gap-4">
              {appointments.map((appointment) => (
                <Card key={appointment.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(appointment.status)}>
                            {getStatusText(appointment.status)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{appointment.specialty}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{appointment.patientName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-muted-foreground" />
                            <span>{appointment.doctorName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(appointment.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{appointment.time}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:col-span-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{appointment.location}</span>
                          </div>
                        </div>

                        {appointment.notes && (
                          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                            <strong>Observações:</strong> {appointment.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 lg:min-w-[120px]">
                        {appointment.status === "scheduled" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(appointment.id, "completed")}
                              className="text-green-600 hover:text-green-700"
                            >
                              Marcar como Realizada
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(appointment.id, "cancelled")}
                              className="text-destructive hover:text-destructive/80"
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(appointment.id)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
