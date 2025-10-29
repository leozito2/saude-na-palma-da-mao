export interface Appointment {
  id: string
  userId: string
  patientName: string
  patientCpf: string
  doctorName: string
  specialty: string
  date: Date
  time: string
  location: string
  notes?: string
  status: "scheduled" | "completed" | "cancelled"
  createdAt: Date
}

// Simple in-memory storage for demo purposes
let appointments: Appointment[] = []

export const getAppointments = async (): Promise<any[]> => {
  try {
    const currentUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null
    if (!currentUser) return []

    const user = JSON.parse(currentUser)
    const response = await fetch(`/api/appointments?userId=${user.id}`)
    const data = await response.json()

    return data.appointments || []
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return []
  }
}

export const createAppointment = async (appointmentData: {
  tipo_consulta: string
  nome_medico: string
  especialidade: string
  data_consulta: string
  horario_consulta: string
  local_consulta: string
  observacoes?: string
}): Promise<{ success: boolean; error?: string; appointment?: any }> => {
  try {
    const currentUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null
    if (!currentUser) {
      return { success: false, error: "User not logged in" }
    }

    const user = JSON.parse(currentUser)

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        ...appointmentData,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error }
    }

    return { success: true, appointment: data.appointment }
  } catch (error) {
    console.error("Error creating appointment:", error)
    return { success: false, error: "Failed to create appointment" }
  }
}

export const updateAppointment = async (
  id: string,
  appointmentData: {
    tipo_consulta?: string
    nome_medico?: string
    especialidade?: string
    data_consulta?: string
    horario_consulta?: string
    local_consulta?: string
    observacoes?: string
    status?: string // Add status field
  },
): Promise<{ success: boolean; error?: string; appointment?: any }> => {
  try {
    const currentUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null
    if (!currentUser) {
      return { success: false, error: "User not logged in" }
    }

    const user = JSON.parse(currentUser)

    console.log("[v0] Updating appointment:", id, appointmentData)

    const response = await fetch(`/api/appointments?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: id, // Include id in request body
        userId: user.id, // Include userId in request body
        ...appointmentData,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] Error response:", data)
      return { success: false, error: data.error }
    }

    console.log("[v0] Update successful:", data)
    return { success: true, appointment: data.appointment }
  } catch (error) {
    console.error("[v0] Error updating appointment:", error)
    return { success: false, error: "Failed to update appointment" }
  }
}

export const deleteAppointment = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const currentUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null
    if (!currentUser) {
      return { success: false, error: "User not logged in" }
    }

    const response = await fetch(`/api/appointments?id=${id}`, {
      method: "DELETE",
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error }
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting appointment:", error)
    return { success: false, error: "Failed to delete appointment" }
  }
}

export const appointmentsService = {
  create: async (
    appointmentData: Omit<Appointment, "id" | "createdAt" | "status">,
  ): Promise<{
    success: boolean
    error?: string
    appointment?: Appointment
  }> => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: Math.random().toString(36).substr(2, 9),
      status: "scheduled",
      createdAt: new Date(),
    }

    appointments.push(newAppointment)

    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("appointments", JSON.stringify(appointments))
    }

    return { success: true, appointment: newAppointment }
  },

  getByUserId: async (userId: string): Promise<Appointment[]> => {
    // Load appointments from localStorage if available
    if (typeof window !== "undefined") {
      const storedAppointments = localStorage.getItem("appointments")
      if (storedAppointments) {
        appointments = JSON.parse(storedAppointments).map((apt: any) => ({
          ...apt,
          date: new Date(apt.date),
          createdAt: new Date(apt.createdAt),
        }))
      }
    }

    return appointments.filter((apt) => apt.userId === userId)
  },

  searchByCpf: async (cpf: string, userId: string): Promise<Appointment[]> => {
    // Load appointments from localStorage if available
    if (typeof window !== "undefined") {
      const storedAppointments = localStorage.getItem("appointments")
      if (storedAppointments) {
        appointments = JSON.parse(storedAppointments).map((apt: any) => ({
          ...apt,
          date: new Date(apt.date),
          createdAt: new Date(apt.createdAt),
        }))
      }
    }

    return appointments.filter((apt) => apt.userId === userId && apt.patientCpf.includes(cpf))
  },

  update: async (
    id: string,
    updates: Partial<Appointment>,
  ): Promise<{
    success: boolean
    error?: string
    appointment?: Appointment
  }> => {
    const index = appointments.findIndex((apt) => apt.id === id)
    if (index === -1) {
      return { success: false, error: "Consulta não encontrada" }
    }

    appointments[index] = { ...appointments[index], ...updates }

    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("appointments", JSON.stringify(appointments))
    }

    return { success: true, appointment: appointments[index] }
  },

  delete: async (id: string): Promise<{ success: boolean; error?: string }> => {
    const index = appointments.findIndex((apt) => apt.id === id)
    if (index === -1) {
      return { success: false, error: "Consulta não encontrada" }
    }

    appointments.splice(index, 1)

    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("appointments", JSON.stringify(appointments))
    }

    return { success: true }
  },
}
