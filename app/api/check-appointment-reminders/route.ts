import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Checking appointment reminders...")

    // Buscar todas as consultas agendadas
    const appointments = await sql`
      SELECT a.*, u.email, u.nome
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      WHERE a.status = 'scheduled'
    `

    console.log(`[v0] Found ${appointments.length} scheduled appointments`)

    const now = new Date()
    const brasiliaOffset = -3 * 60 // UTC-3 em minutos
    const nowBrasilia = new Date(now.getTime() + brasiliaOffset * 60 * 1000)

    console.log(`[v0] Current time in Brasilia: ${nowBrasilia.toISOString()}`)

    const remindersToSend = []

    for (const appointment of appointments) {
      // Combinar data e horário da consulta
      const appointmentDate = new Date(appointment.data_consulta)
      const [hour, minute] = appointment.horario_consulta.split(":").map(Number)

      // Ajustar para horário de Brasília
      appointmentDate.setHours(hour, minute, 0, 0)
      const appointmentTimeBrasilia = new Date(appointmentDate.getTime() - brasiliaOffset * 60 * 1000)

      // Calcular diferença em minutos
      const diffMinutes = Math.floor((appointmentTimeBrasilia.getTime() - now.getTime()) / (1000 * 60))

      console.log(
        `[v0] Appointment ${appointment.id}: ${appointment.nome_medico} at ${appointment.horario_consulta}, diff: ${diffMinutes} minutes`,
      )

      // Enviar lembrete 1 hora (60 minutos) antes
      if (diffMinutes >= 59 && diffMinutes <= 61) {
        console.log(`[v0] Sending 1-hour reminder for appointment with ${appointment.nome_medico}`)
        remindersToSend.push({
          email: appointment.email,
          tipo_consulta: appointment.tipo_consulta,
          nome_medico: appointment.nome_medico,
          especialidade: appointment.especialidade,
          data_consulta: appointment.data_consulta,
          horario_consulta: appointment.horario_consulta,
          local_consulta: appointment.local_consulta,
          hoursBefore: 1,
        })
      }
    }

    // Enviar todos os lembretes
    const results = await Promise.all(
      remindersToSend.map(async (reminder) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-appointment-reminder`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(reminder),
          })

          if (!response.ok) {
            throw new Error(`Failed to send reminder: ${response.statusText}`)
          }

          return { success: true, reminder }
        } catch (error) {
          console.error("[v0] Error sending reminder:", error)
          return { success: false, reminder, error }
        }
      }),
    )

    const successCount = results.filter((r) => r.success).length
    console.log(`[v0] Sent ${successCount} out of ${remindersToSend.length} reminders`)

    return NextResponse.json({
      success: true,
      checked: appointments.length,
      sent: successCount,
      results,
    })
  } catch (error: any) {
    console.error("[v0] Error checking appointment reminders:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
