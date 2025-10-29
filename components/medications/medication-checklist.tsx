"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { medicationsService, type Medication, type MedicationLog } from "@/lib/medications"
import { useAuth } from "@/contexts/auth-context"
import { Check, X, Clock, Pill, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface MedicationScheduleItem {
  medication: Medication
  times: string[]
  logs: MedicationLog[]
}

export function MedicationChecklist() {
  const { user } = useAuth()
  const [schedule, setSchedule] = useState<MedicationScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notes, setNotes] = useState<{ [key: string]: string }>({})

  const loadTodaySchedule = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const todaySchedule = await medicationsService.getTodaySchedule(user.id)
      setSchedule(todaySchedule)
    } catch (error) {
      console.error("Error loading today's schedule:", error)
    }
    setIsLoading(false)
  }

  const handleLogMedication = async (medicationId: string, scheduledTime: string, status: MedicationLog["status"]) => {
    if (!user) return

    try {
      const noteKey = `${medicationId}-${scheduledTime}`
      await medicationsService.logMedication(medicationId, user.id, scheduledTime, status, notes[noteKey])

      // Clear the note after logging
      setNotes((prev) => ({ ...prev, [noteKey]: "" }))

      // Reload the schedule to update the UI
      loadTodaySchedule()
    } catch (error) {
      console.error("Error logging medication:", error)
    }
  }

  const isTimeTaken = (medicationId: string, time: string, logs: MedicationLog[]) => {
    return logs.some((log) => log.scheduledTime === time && log.status === "taken")
  }

  const isTimeMissed = (medicationId: string, time: string, logs: MedicationLog[]) => {
    return logs.some((log) => log.scheduledTime === time && log.status === "missed")
  }

  const isTimeSkipped = (medicationId: string, time: string, logs: MedicationLog[]) => {
    return logs.some((log) => log.scheduledTime === time && log.status === "skipped")
  }

  const getTimeStatus = (medicationId: string, time: string, logs: MedicationLog[]) => {
    if (isTimeTaken(medicationId, time, logs)) return "taken"
    if (isTimeMissed(medicationId, time, logs)) return "missed"
    if (isTimeSkipped(medicationId, time, logs)) return "skipped"
    return "pending"
  }

  const updateNotes = (medicationId: string, scheduledTime: string, value: string) => {
    const noteKey = `${medicationId}-${scheduledTime}`
    setNotes((prev) => ({ ...prev, [noteKey]: value }))
  }

  useEffect(() => {
    loadTodaySchedule()
  }, [user])

  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary">Checklist de Medicamentos</CardTitle>
        <CardDescription>Controle diário dos medicamentos - {today}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando agenda de hoje...</div>
        ) : schedule.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Nenhum medicamento ativo para hoje</p>
          </div>
        ) : (
          <div className="space-y-6">
            {schedule.map((item) => (
              <Card key={item.medication.id} className="border-l-4 border-l-accent/50">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{item.medication.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.medication.dosage} - {item.medication.frequency}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {item.times.map((time) => {
                        const status = getTimeStatus(item.medication.id, time, item.logs)
                        const noteKey = `${item.medication.id}-${time}`

                        return (
                          <div key={time} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{time}</span>
                                <Badge
                                  className={
                                    status === "taken"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                      : status === "missed"
                                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                        : status === "skipped"
                                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                          : "bg-muted text-muted-foreground"
                                  }
                                >
                                  {status === "taken"
                                    ? "Tomado"
                                    : status === "missed"
                                      ? "Perdido"
                                      : status === "skipped"
                                        ? "Pulado"
                                        : "Pendente"}
                                </Badge>
                              </div>

                              {status === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleLogMedication(item.medication.id, time, "taken")}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleLogMedication(item.medication.id, time, "missed")}
                                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleLogMedication(item.medication.id, time, "skipped")}
                                    className="text-yellow-600 hover:text-yellow-700 border-yellow-200 hover:border-yellow-300"
                                  >
                                    <AlertCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            {status === "pending" && (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Observações (opcional)"
                                  value={notes[noteKey] || ""}
                                  onChange={(e) => updateNotes(item.medication.id, time, e.target.value)}
                                  rows={2}
                                  className="text-sm"
                                />
                              </div>
                            )}

                            {status !== "pending" && (
                              <div className="text-sm text-muted-foreground">
                                {item.logs
                                  .filter((log) => log.scheduledTime === time)
                                  .map((log) => (
                                    <div key={log.id}>
                                      Registrado às {format(log.takenAt, "HH:mm", { locale: ptBR })}
                                      {log.notes && (
                                        <div className="mt-1 text-xs bg-muted/50 p-2 rounded">
                                          <strong>Observações:</strong> {log.notes}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <strong>Instruções:</strong> {item.medication.instructions}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
