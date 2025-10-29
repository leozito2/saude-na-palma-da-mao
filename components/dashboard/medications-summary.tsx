"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { medicationsService, type Medication } from "@/lib/medications"
import { Pill, Clock, Plus, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface MedicationScheduleItem {
  medication: Medication
  times: string[]
  logs: any[]
}

export function MedicationsSummary() {
  const { user } = useAuth()
  const router = useRouter()
  const [todaySchedule, setTodaySchedule] = useState<MedicationScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadTodaySchedule = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const schedule = await medicationsService.getTodaySchedule(user.id)
      setTodaySchedule(schedule)
    } catch (error) {
      console.error("Error loading today's medication schedule:", error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadTodaySchedule()
  }, [user])

  const getPendingCount = () => {
    let pendingCount = 0
    todaySchedule.forEach((item) => {
      item.times.forEach((time) => {
        const isLogged = item.logs.some((log) => log.scheduledTime === time)
        if (!isLogged) {
          pendingCount++
        }
      })
    })
    return pendingCount
  }

  const getNextMedication = () => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    let nextMed = null
    let minTimeDiff = Number.POSITIVE_INFINITY

    todaySchedule.forEach((item) => {
      item.times.forEach((time) => {
        const isLogged = item.logs.some((log) => log.scheduledTime === time)
        if (!isLogged) {
          const [hours, minutes] = time.split(":").map(Number)
          const medicationTime = hours * 60 + minutes
          const timeDiff = medicationTime - currentTime

          if (timeDiff >= 0 && timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff
            nextMed = { medication: item.medication, time }
          }
        }
      })
    })

    return nextMed
  }

  const pendingCount = getPendingCount()
  const nextMedication = getNextMedication()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-primary">Medicamentos de Hoje</CardTitle>
            <CardDescription>Resumo dos medicamentos para hoje</CardDescription>
          </div>
          <Button onClick={() => router.push("/medications")} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Gerenciar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando medicamentos...</div>
        ) : todaySchedule.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Nenhum medicamento ativo para hoje</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{todaySchedule.length}</div>
                <div className="text-sm text-muted-foreground">Medicamentos</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-accent">{pendingCount}</div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
            </div>

            {/* Next Medication */}
            {nextMedication && (
              <Card className="border-l-4 border-l-accent">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium text-accent">Próximo medicamento</span>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">{nextMedication.medication.name}</div>
                    <div className="text-sm text-muted-foreground">{nextMedication.medication.dosage}</div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{nextMedication.time}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Schedule */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Agenda de hoje</h4>
              <div className="space-y-2">
                {todaySchedule.map((item) => (
                  <Card key={item.medication.id} className="border-l-4 border-l-primary/20">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{item.medication.name}</div>
                            <div className="text-xs text-muted-foreground">{item.medication.dosage}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.medication.frequency}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.times.map((time) => {
                            const isLogged = item.logs.some((log) => log.scheduledTime === time)
                            return (
                              <Badge
                                key={time}
                                className={
                                  isLogged
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs"
                                    : "bg-muted text-muted-foreground text-xs"
                                }
                              >
                                {time}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
