export interface MedicationReminder {
  medicationId: string
  medicationName: string
  dosage: string
  scheduledTime: string
  userEmail: string
  remindersSent: {
    tenMinutes: boolean
    fiveMinutes: boolean
  }
}

export const medicationReminderService = {
  scheduleReminders: async (
    medicationId: string,
    medicationName: string,
    dosage: string,
    scheduledTime: string,
    userEmail: string,
  ): Promise<void> => {
    // Parse scheduled time (format: "HH:MM")
    const [hours, minutes] = scheduledTime.split(":").map(Number)
    const now = new Date()
    const scheduledDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)

    // Calculate reminder times
    const tenMinutesBefore = new Date(scheduledDate.getTime() - 10 * 60 * 1000)
    const fiveMinutesBefore = new Date(scheduledDate.getTime() - 5 * 60 * 1000)

    // Schedule 10-minute reminder
    const timeUntilTenMin = tenMinutesBefore.getTime() - now.getTime()
    if (timeUntilTenMin > 0) {
      setTimeout(async () => {
        await medicationReminderService.sendReminder(userEmail, medicationName, dosage, scheduledTime, 10)
      }, timeUntilTenMin)
    }

    // Schedule 5-minute reminder
    const timeUntilFiveMin = fiveMinutesBefore.getTime() - now.getTime()
    if (timeUntilFiveMin > 0) {
      setTimeout(async () => {
        await medicationReminderService.sendReminder(userEmail, medicationName, dosage, scheduledTime, 5)
      }, timeUntilFiveMin)
    }
  },

  sendReminder: async (
    email: string,
    medicationName: string,
    dosage: string,
    scheduledTime: string,
    minutesBefore: number,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/send-medication-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          medicationName,
          dosage,
          scheduledTime,
          minutesBefore,
        }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error sending medication reminder:", error)
      return { success: false, error: "Erro ao enviar lembrete" }
    }
  },
}
