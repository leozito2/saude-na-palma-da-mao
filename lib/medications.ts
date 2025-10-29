export interface Medication {
  id: string
  userId: string
  name: string
  dosage: string
  frequency: string
  startDate: Date
  endDate?: Date
  instructions: string
  prescribedBy: string
  isActive: boolean
  reminderTimes: string[] // Array of times like ["08:00", "14:00", "20:00"]
  createdAt: Date
}

export interface MedicationLog {
  id: string
  medicationId: string
  userId: string
  takenAt: Date
  scheduledTime: string
  status: "taken" | "missed" | "skipped"
  notes?: string
}

// Simple in-memory storage for demo purposes
let medications: any[] = []
let medicationLogs: MedicationLog[] = []

export const createMedication = async (medicationData: {
  nome: string
  principio_ativo: string
  tipo: string
  dose: string
  horario_uso: string
  data_vencimento: string
  duracao_dias?: number
  frequencia_diaria?: number
}): Promise<{ success: boolean; error?: string; medication?: any }> => {
  try {
    const currentUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null
    if (!currentUser) {
      return { success: false, error: "User not logged in" }
    }

    const user = JSON.parse(currentUser)

    const response = await fetch("/api/medications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        ...medicationData,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error }
    }

    return { success: true, medication: data.medication }
  } catch (error) {
    console.error("Error creating medication:", error)
    return { success: false, error: "Failed to create medication" }
  }
}

export const medicationsService = {
  create: async (
    medicationData: Omit<Medication, "id" | "createdAt" | "isActive">,
  ): Promise<{
    success: boolean
    error?: string
    medication?: Medication
  }> => {
    const newMedication: Medication = {
      ...medicationData,
      id: Math.random().toString(36).substr(2, 9),
      isActive: true,
      createdAt: new Date(),
    }

    medications.push(newMedication)

    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("medications", JSON.stringify(medications))
    }

    return { success: true, medication: newMedication }
  },

  getByUserId: async (userId: string): Promise<any[]> => {
    // Load medications from localStorage if available
    if (typeof window !== "undefined") {
      const storedMedications = localStorage.getItem("medications")
      if (storedMedications) {
        medications = JSON.parse(storedMedications).map((med: any) => ({
          ...med,
          startDate: new Date(med.startDate),
          endDate: med.endDate ? new Date(med.endDate) : undefined,
          createdAt: new Date(med.createdAt),
        }))
      }
    }

    return medications.filter((med) => med.userId === userId)
  },

  update: async (
    id: string,
    updates: Partial<Medication>,
  ): Promise<{
    success: boolean
    error?: string
    medication?: Medication
  }> => {
    const index = medications.findIndex((med) => med.id === id)
    if (index === -1) {
      return { success: false, error: "Medicamento não encontrado" }
    }

    medications[index] = { ...medications[index], ...updates }

    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("medications", JSON.stringify(medications))
    }

    return { success: true, medication: medications[index] }
  },

  delete: async (id: string): Promise<{ success: boolean; error?: string }> => {
    const index = medications.findIndex((med) => med.id === id)
    if (index === -1) {
      return { success: false, error: "Medicamento não encontrado" }
    }

    medications.splice(index, 1)

    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("medications", JSON.stringify(medications))
    }

    return { success: true }
  },

  // Medication logs
  logMedication: async (
    medicationId: string,
    userId: string,
    scheduledTime: string,
    status: MedicationLog["status"],
    notes?: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const newLog: MedicationLog = {
      id: Math.random().toString(36).substr(2, 9),
      medicationId,
      userId,
      takenAt: new Date(),
      scheduledTime,
      status,
      notes,
    }

    medicationLogs.push(newLog)

    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("medicationLogs", JSON.stringify(medicationLogs))
    }

    return { success: true }
  },

  getMedicationLogs: async (userId: string, medicationId?: string): Promise<MedicationLog[]> => {
    // Load logs from localStorage if available
    if (typeof window !== "undefined") {
      const storedLogs = localStorage.getItem("medicationLogs")
      if (storedLogs) {
        medicationLogs = JSON.parse(storedLogs).map((log: any) => ({
          ...log,
          takenAt: new Date(log.takenAt),
        }))
      }
    }

    let filteredLogs = medicationLogs.filter((log) => log.userId === userId)
    if (medicationId) {
      filteredLogs = filteredLogs.filter((log) => log.medicationId === medicationId)
    }

    return filteredLogs.sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime())
  },

  getTodaySchedule: async (
    userId: string,
  ): Promise<
    Array<{
      medication: any
      times: string[]
      logs: MedicationLog[]
    }>
  > => {
    const userMedications = await medicationsService.getByUserId(userId)
    const activeMedications = userMedications.filter((med) => med.ativo)

    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    const schedule = []

    for (const medication of activeMedications) {
      const todayLogs = medicationLogs.filter(
        (log) =>
          log.medicationId === medication.id &&
          log.userId === userId &&
          log.takenAt.toISOString().split("T")[0] === todayStr,
      )

      schedule.push({
        medication,
        times: medication.horario_uso.split(","),
        logs: todayLogs,
      })
    }

    return schedule
  },
}

export const getMedications = async (): Promise<any[]> => {
  try {
    const currentUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null
    if (!currentUser) return []

    const user = JSON.parse(currentUser)
    const response = await fetch(`/api/medications?userId=${user.id}`)
    const data = await response.json()

    return data.medications || []
  } catch (error) {
    console.error("Error fetching medications:", error)
    return []
  }
}

export const moveMedicationToHistory = async (medicationId: string, motivo = "tomado"): Promise<boolean> => {
  try {
    const currentUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null
    if (!currentUser) return false

    const user = JSON.parse(currentUser)

    const response = await fetch("/api/medications/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medicationId,
        userId: user.id,
        motivo,
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Error moving medication to history:", error)
    return false
  }
}

export const getMedicationHistory = async (): Promise<any[]> => {
  try {
    const currentUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null
    if (!currentUser) return []

    const user = JSON.parse(currentUser)
    const response = await fetch(`/api/medications/history?userId=${user.id}`)
    const data = await response.json()

    return data.history || []
  } catch (error) {
    console.error("Error fetching medication history:", error)
    return []
  }
}
