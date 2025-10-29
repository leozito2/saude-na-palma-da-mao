"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { appointmentsService } from "@/lib/appointments"
import { emailService } from "@/lib/email-service"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Calendar, Clock, User, Stethoscope, MapPin, FileText, Bell } from "lucide-react"

interface AppointmentFormProps {
  onSuccess: () => void
  onCancel: () => void
}

const specialties = [
  "Cardiologia",
  "Dermatologia",
  "Endocrinologia",
  "Gastroenterologia",
  "Ginecologia",
  "Neurologia",
  "Oftalmologia",
  "Ortopedia",
  "Pediatria",
  "Psiquiatria",
  "Urologia",
  "Clínico Geral",
]

export function AppointmentForm({ onSuccess, onCancel }: AppointmentFormProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [enableReminder, setEnableReminder] = useState(true)
  const [formData, setFormData] = useState({
    patientName: "",
    patientCpf: "",
    doctorName: "",
    specialty: "",
    date: "",
    time: "",
    location: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError("")

    try {
      const appointmentDate = new Date(`${formData.date}T${formData.time}`)

      const result = await appointmentsService.create({
        userId: user.id,
        patientName: formData.patientName,
        patientCpf: formData.patientCpf,
        doctorName: formData.doctorName,
        specialty: formData.specialty,
        date: appointmentDate,
        time: formData.time,
        location: formData.location,
        notes: formData.notes,
      })

      if (result.success) {
        if (enableReminder) {
          try {
            await emailService.scheduleAppointmentReminder(
              user.id,
              {
                patientName: formData.patientName,
                doctorName: formData.doctorName,
                date: appointmentDate,
                time: formData.time,
                location: formData.location,
              },
              user.email,
            )
          } catch (emailError) {
            console.log("Email reminder scheduling failed, but appointment was saved:", emailError)
          }
        }

        onSuccess()
      } else {
        setError(result.error || "Erro ao agendar consulta")
      }
    } catch (err) {
      console.error("Error creating appointment:", err)
      setError("Erro ao agendar consulta")
    }

    setIsLoading(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary">Nova Consulta</CardTitle>
        <CardDescription>Preencha os dados para agendar uma nova consulta médica</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Nome do Paciente</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="patientName"
                  type="text"
                  placeholder="Nome completo do paciente"
                  value={formData.patientName}
                  onChange={(e) => handleInputChange("patientName", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patientCpf">CPF do Paciente</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="patientCpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.patientCpf}
                  onChange={(e) => handleInputChange("patientCpf", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doctorName">Nome do Médico</Label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="doctorName"
                  type="text"
                  placeholder="Dr. Nome do médico"
                  value={formData.doctorName}
                  onChange={(e) => handleInputChange("doctorName", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade</Label>
              <Select value={formData.specialty} onValueChange={(value) => handleInputChange("specialty", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a especialidade" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Local</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  type="text"
                  placeholder="Hospital, clínica ou consultório"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais sobre a consulta"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="reminder" checked={enableReminder} onCheckedChange={setEnableReminder} />
            <Label htmlFor="reminder" className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4" />
              Receber lembrete por email (1 dia antes)
            </Label>
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agendar Consulta
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
