"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { appointmentsService } from "@/lib/appointments"
import { medicationsService } from "@/lib/medications"
import { Calendar, Pill } from "lucide-react"

interface Stats {
  totalAppointments: number
  upcomingAppointments: number
  totalMedications: number
  activeMedications: number
}

export function QuickStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalAppointments: 0,
    upcomingAppointments: 0,
    totalMedications: 0,
    activeMedications: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const loadStats = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Load appointments
      const appointments = await appointmentsService.getByUserId(user.id)
      const now = new Date()
      const upcomingAppointments = appointments.filter((apt) => apt.status === "scheduled" && new Date(apt.date) >= now)

      // Load medications
      const medications = await medicationsService.getByUserId(user.id)
      const activeMedications = medications.filter((med) => med.isActive)

      setStats({
        totalAppointments: appointments.length,
        upcomingAppointments: upcomingAppointments.length,
        totalMedications: medications.length,
        activeMedications: activeMedications.length,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadStats()
  }, [user])

  const statCards = [
    {
      title: "Consultas Agendadas",
      value: stats.upcomingAppointments,
      total: stats.totalAppointments,
      icon: Calendar,
      description: "próximas consultas",
      color: "text-primary",
    },
    {
      title: "Medicamentos Ativos",
      value: stats.activeMedications,
      total: stats.totalMedications,
      icon: Pill,
      description: "medicamentos em uso",
      color: "text-accent",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stat.value}
              <span className="text-sm font-normal text-muted-foreground ml-1">{!isLoading && `de ${stat.total}`}</span>
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
