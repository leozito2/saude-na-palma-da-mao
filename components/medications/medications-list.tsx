"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { medicationsService, type Medication } from "@/lib/medications"
import { useAuth } from "@/contexts/auth-context"
import { Calendar, Clock, User, Plus, Trash2, Power, PowerOff } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface MedicationsListProps {
  onNewMedication: () => void
}

export function MedicationsList({ onNewMedication }: MedicationsListProps) {
  const { user } = useAuth()
  const [medications, setMedications] = useState<Medication[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadMedications = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const userMedications = await medicationsService.getByUserId(user.id)
      setMedications(userMedications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    } catch (error) {
      console.error("Error loading medications:", error)
    }
    setIsLoading(false)
  }

  const handleToggleActive = async (medicationId: string, isActive: boolean) => {
    try {
      await medicationsService.update(medicationId, { isActive: !isActive })
      loadMedications()
    } catch (error) {
      console.error("Error updating medication:", error)
    }
  }

  const handleDelete = async (medicationId: string) => {
    if (confirm("Tem certeza que deseja excluir este medicamento?")) {
      try {
        await medicationsService.delete(medicationId)
        loadMedications()
      } catch (error) {
        console.error("Error deleting medication:", error)
      }
    }
  }

  useEffect(() => {
    loadMedications()
  }, [user])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold text-primary">Medicamentos</CardTitle>
              <CardDescription>Gerencie seus medicamentos e lembretes</CardDescription>
            </div>
            <Button onClick={onNewMedication} className="sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Medicamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando medicamentos...</div>
          ) : medications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum medicamento cadastrado</div>
          ) : (
            <div className="grid gap-4">
              {medications.map((medication) => (
                <Card key={medication.id} className="border-l-4 border-l-accent/50">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={
                              medication.isActive
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {medication.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{medication.frequency}</span>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{medication.name}</h3>
                          <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{medication.prescribedBy}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Início: {format(medication.startDate, "dd/MM/yyyy", { locale: ptBR })}
                              {medication.endDate &&
                                ` - Fim: ${format(medication.endDate, "dd/MM/yyyy", { locale: ptBR })}`}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Horários:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {medication.reminderTimes.map((time, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {time}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                          <strong>Instruções:</strong> {medication.instructions}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 lg:min-w-[140px]">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(medication.id, medication.isActive)}
                          className={
                            medication.isActive
                              ? "text-orange-600 hover:text-orange-700"
                              : "text-green-600 hover:text-green-700"
                          }
                        >
                          {medication.isActive ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" />
                              Ativar
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(medication.id)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
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
