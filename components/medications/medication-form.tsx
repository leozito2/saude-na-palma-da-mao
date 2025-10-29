"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { medicationsService } from "@/lib/medications"
import { emailService } from "@/lib/email-service"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Pill, Calendar, Clock, User, Plus, X, Bell } from "lucide-react"

interface MedicationFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function MedicationForm({ onSuccess, onCancel }: MedicationFormProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [enableReminders, setEnableReminders] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    startDate: "",
    endDate: "",
    instructions: "",
    prescribedBy: "",
  })
  const [reminderTimes, setReminderTimes] = useState<string[]>(["08:00"])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError("")

    try {
      const startDate = new Date(formData.startDate)
      const endDate = formData.endDate ? new Date(formData.endDate) : undefined

      const result = await medicationsService.create({
        userId: user.id,
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        startDate,
        endDate,
        instructions: formData.instructions,
        prescribedBy: formData.prescribedBy,
        reminderTimes: reminderTimes.filter((time) => time.trim() !== ""),
      })

      if (result.success) {
        if (enableReminders) {
          try {
            await emailService.scheduleMedicationReminder(
              user.email,
              formData.name,
              result.medication?.id || "",
              formData.dosage,
              reminderTimes[0] || "08:00",
            )
          } catch (emailError) {
            console.log("Email reminder scheduling failed, but medication was saved:", emailError)
          }
        }

        onSuccess()
      } else {
        setError(result.error || "Erro ao cadastrar medicamento")
      }
    } catch (err) {
      console.error("Error creating medication:", err)
      setError("Erro ao cadastrar medicamento")
    }

    setIsLoading(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addReminderTime = () => {
    setReminderTimes((prev) => [...prev, ""])
  }

  const updateReminderTime = (index: number, time: string) => {
    setReminderTimes((prev) => prev.map((t, i) => (i === index ? time : t)))
  }

  const removeReminderTime = (index: number) => {
    setReminderTimes((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary">Novo Medicamento</CardTitle>
        <CardDescription>Cadastre um novo medicamento e configure os lembretes</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Medicamento</Label>
              <div className="relative">
                <Pill className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Ex: Paracetamol"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">Dosagem</Label>
              <Input
                id="dosage"
                type="text"
                placeholder="Ex: 500mg"
                value={formData.dosage}
                onChange={(e) => handleInputChange("dosage", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência</Label>
              <Input
                id="frequency"
                type="text"
                placeholder="Ex: 3x ao dia"
                value={formData.frequency}
                onChange={(e) => handleInputChange("frequency", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prescribedBy">Prescrito por</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="prescribedBy"
                  type="text"
                  placeholder="Dr. Nome do médico"
                  value={formData.prescribedBy}
                  onChange={(e) => handleInputChange("prescribedBy", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Término (opcional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Horários dos Lembretes</Label>
            <div className="space-y-2">
              {reminderTimes.map((time, index) => (
                <div key={index} className="flex gap-2">
                  <div className="relative flex-1">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => updateReminderTime(index, e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  {reminderTimes.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeReminderTime(index)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addReminderTime} className="w-full bg-transparent">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Horário
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instruções de Uso</Label>
            <Textarea
              id="instructions"
              placeholder="Ex: Tomar com água, após as refeições"
              value={formData.instructions}
              onChange={(e) => handleInputChange("instructions", e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="reminders" checked={enableReminders} onCheckedChange={setEnableReminders} />
            <Label htmlFor="reminders" className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4" />
              Receber lembretes por email nos horários configurados
            </Label>
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar Medicamento
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
