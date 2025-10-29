"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { appointmentsService, type Appointment } from "@/lib/appointments"
import { Clock, User, Stethoscope, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"

export function AppointmentsCalendar() {
  const { user } = useAuth()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadAppointments = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const userAppointments = await appointmentsService.getByUserId(user.id)
      setAppointments(userAppointments.filter((apt) => apt.status === "scheduled"))
    } catch (error) {
      console.error("Error loading appointments:", error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadAppointments()
  }, [user])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => isSameDay(new Date(apt.date), date))
  }

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : []

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => (direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)))
    setSelectedDate(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-primary">Calendário de Consultas</CardTitle>
            <CardDescription>Visualize suas consultas agendadas</CardDescription>
          </div>
          <Button onClick={() => router.push("/appointments")} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nova Consulta
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando calendário...</div>
        ) : (
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold capitalize">
                {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </h3>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div key={day} className="p-2 font-medium text-muted-foreground">
                  {day}
                </div>
              ))}

              {monthDays.map((day) => {
                const dayAppointments = getAppointmentsForDate(day)
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isToday = isSameDay(day, new Date())

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(isSelected ? null : day)}
                    className={`
                      p-2 text-sm rounded-md transition-colors relative
                      ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                      ${isToday ? "ring-2 ring-primary ring-offset-2" : ""}
                    `}
                  >
                    <span>{format(day, "d")}</span>
                    {dayAppointments.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-1 h-1 bg-accent rounded-full"></div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selected Date Appointments */}
            {selectedDate && (
              <div className="mt-6 space-y-3">
                <h4 className="font-medium text-foreground">
                  Consultas para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h4>
                {selectedDateAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma consulta agendada para este dia</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDateAppointments.map((appointment) => (
                      <Card key={appointment.id} className="border-l-4 border-l-primary/20">
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-accent text-accent-foreground">{appointment.specialty}</Badge>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {appointment.time}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span>{appointment.patientName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Stethoscope className="h-3 w-3 text-muted-foreground" />
                                <span>{appointment.doctorName}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
