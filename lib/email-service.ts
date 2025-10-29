export interface EmailNotification {
  id: string
  to: string
  subject: string
  message: string
  scheduledFor: Date
  sent: boolean
  medicationId: string
  medicationName: string
}

interface SentEmail {
  to: string
  subject: string
  message: string
  sentAt: Date
}

let emailQueue: EmailNotification[] = []
const sentEmails: SentEmail[] = []

export const emailService = {
  // Schedule email to be sent 5 minutes before medication time
  scheduleMedicationReminder: async (
    userEmail: string,
    medicationName: string,
    medicationId: string,
    dose: string,
    scheduledTime: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const [hours, minutes] = scheduledTime.split(":").map(Number)
      const scheduledDate = new Date()
      scheduledDate.setHours(hours, minutes - 5, 0, 0) // 5 minutes before

      // If the time has already passed today, schedule for tomorrow
      if (scheduledDate < new Date()) {
        scheduledDate.setDate(scheduledDate.getDate() + 1)
      }

      const emailNotification: EmailNotification = {
        id: Math.random().toString(36).substr(2, 9),
        to: userEmail,
        subject: `MedCare - Lembrete de Medicamento: ${medicationName}`,
        message: `
          Olá!

          Este é um lembrete automático do MedCare para tomar seu medicamento.

          📋 Detalhes do Medicamento:
          • Nome: ${medicationName}
          • Dose: ${dose}
          • Horário programado: ${scheduledTime}

          ⏰ Este lembrete foi enviado 5 minutos antes do horário programado para que você possa se preparar.

          💊 Não se esqueça de marcar no app quando tomar o medicamento para manter seu histórico atualizado.

          ---
          MedCare - Cuidando da sua saúde
          Este é um email automático, não responda a esta mensagem.
        `,
        scheduledFor: scheduledDate,
        sent: false,
        medicationId,
        medicationName,
      }

      emailQueue.push(emailNotification)

      // Store in localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("emailQueue", JSON.stringify(emailQueue))
      }

      // Schedule the actual email sending
      scheduleEmailSending(emailNotification)

      return { success: true }
    } catch (error) {
      console.error("Error scheduling medication reminder:", error)
      return { success: false, error: "Erro ao agendar lembrete" }
    }
  },

  scheduleAppointmentReminder: async (
    userId: string,
    appointmentData: {
      patientName: string
      doctorName: string
      date: Date
      time: string
      location: string
    },
    userEmail: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Schedule reminder for 1 day before appointment
      const reminderDate = new Date(appointmentData.date)
      reminderDate.setDate(reminderDate.getDate() - 1)
      reminderDate.setHours(9, 0, 0, 0) // Send at 9 AM the day before

      const emailNotification: EmailNotification = {
        id: Math.random().toString(36).substr(2, 9),
        to: userEmail,
        subject: `MedCare - Lembrete de Consulta: ${appointmentData.doctorName}`,
        message: `
          Olá!

          Este é um lembrete automático do MedCare sobre sua consulta médica.

          📅 Detalhes da Consulta:
          • Paciente: ${appointmentData.patientName}
          • Médico: ${appointmentData.doctorName}
          • Data: ${appointmentData.date.toLocaleDateString("pt-BR")}
          • Horário: ${appointmentData.time}
          • Local: ${appointmentData.location}

          ⏰ Sua consulta é amanhã! Não se esqueça de chegar com antecedência.

          💡 Dicas para a consulta:
          • Leve seus documentos e exames
          • Prepare uma lista de dúvidas
          • Chegue 15 minutos antes

          ---
          MedCare - Cuidando da sua saúde
          Este é um email automático, não responda a esta mensagem.
        `,
        scheduledFor: reminderDate,
        sent: false,
        medicationId: "", // Not applicable for appointments
        medicationName: `Consulta - ${appointmentData.doctorName}`,
      }

      emailQueue.push(emailNotification)

      // Store in localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("emailQueue", JSON.stringify(emailQueue))
      }

      // Schedule the actual email sending
      scheduleEmailSending(emailNotification)

      return { success: true }
    } catch (error) {
      console.error("Error scheduling appointment reminder:", error)
      return { success: false, error: "Erro ao agendar lembrete" }
    }
  },

  // Get all scheduled emails for a user
  getScheduledEmails: (userEmail: string): EmailNotification[] => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("emailQueue")
      if (stored) {
        emailQueue = JSON.parse(stored)
      }
    }

    return emailQueue.filter((email) => email.to === userEmail)
  },

  // Cancel a scheduled email
  cancelScheduledEmail: (emailId: string) => {
    emailQueue = emailQueue.filter((email) => email.id !== emailId)

    if (typeof window !== "undefined") {
      localStorage.setItem("emailQueue", JSON.stringify(emailQueue))
    }
  },

  // Mark email as sent
  markEmailAsSent: (emailId: string) => {
    const email = emailQueue.find((e) => e.id === emailId)
    if (email) {
      email.sent = true

      if (typeof window !== "undefined") {
        localStorage.setItem("emailQueue", JSON.stringify(emailQueue))
      }
    }
  },

  // Send password reset email
  sendPasswordResetEmail: async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const resetToken = Math.random().toString(36).substr(2, 8).toUpperCase()

      console.log(`[MedCare Email] Sending password reset email to ${email}`)
      console.log(`Reset token: ${resetToken}`)

      const resetEmail: SentEmail = {
        to: email,
        subject: "MedCare - Redefinição de Senha",
        message: `
          Olá!

          Você solicitou a redefinição de sua senha no MedCare.

          🔐 Seu código de verificação é: ${resetToken}

          Este código é válido por 15 minutos e pode ser usado apenas uma vez.

          Se você não solicitou esta redefinição, ignore este email.

          ---
          MedCare - Cuidando da sua saúde
          Este é um email automático, não responda a esta mensagem.
        `,
        sentAt: new Date(),
      }

      // Store the email in localStorage for demo purposes
      if (typeof window !== "undefined") {
        sentEmails.push(resetEmail)
        localStorage.setItem("sentEmails", JSON.stringify(sentEmails))

        // Store reset token temporarily
        localStorage.setItem(
          "passwordResetToken",
          JSON.stringify({
            email,
            token: resetToken,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          }),
        )
      }

      // Show browser notification if permission is granted
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("MedCare - Código de Recuperação", {
          body: `Código enviado para ${email}: ${resetToken}`,
          icon: "/favicon.ico",
        })
      }

      if (typeof window !== "undefined") {
        setTimeout(() => {
          alert(
            `Email de recuperação enviado!\n\nPara fins de demonstração, seu código é: ${resetToken}\n\nEm um app real, este código seria enviado por email.`,
          )
        }, 1000)
      }

      return { success: true }
    } catch (error) {
      console.error("Error sending password reset email:", error)
      return { success: false, error: "Erro ao enviar email de recuperação" }
    }
  },
}

// Function to schedule actual email sending
function scheduleEmailSending(emailNotification: EmailNotification) {
  const now = new Date()
  const delay = emailNotification.scheduledFor.getTime() - now.getTime()

  if (delay > 0) {
    setTimeout(() => {
      // In a real application, this would send an actual email
      // For demo purposes, we'll just log it and mark as sent
      console.log(`[MedCare Email] Sending reminder email to ${emailNotification.to}`)
      console.log(`Subject: ${emailNotification.subject}`)
      console.log(`Message: ${emailNotification.message}`)

      // Mark as sent
      emailService.markEmailAsSent(emailNotification.id)

      // Show browser notification if permission is granted
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification(`MedCare - ${emailNotification.medicationName}`, {
          body: `Hora de tomar seu medicamento!`,
          icon: "/favicon.ico",
        })
      }
    }, delay)
  }
}

// Request notification permission on load
if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
  Notification.requestPermission()
}
