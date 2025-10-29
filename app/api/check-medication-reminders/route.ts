import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Checking medication reminders...")

    // Buscar todos os medicamentos ativos
    const medications = await sql`
      SELECT m.*, u.email, u.nome
      FROM medications m
      JOIN users u ON m.user_id = u.id
      WHERE m.ativo = true
    `

    console.log(`[v0] Found ${medications.length} active medications`)

    const now = new Date()
    const brasiliaOffset = -3 * 60 // UTC-3 em minutos
    const nowBrasilia = new Date(now.getTime() + brasiliaOffset * 60 * 1000)

    const currentHour = nowBrasilia.getHours()
    const currentMinute = nowBrasilia.getMinutes()
    const currentTime = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`

    console.log(`[v0] Current time in Brasilia: ${currentTime}`)

    const remindersToSend = []

    for (const medication of medications) {
      const [medHour, medMinute] = medication.horario_uso.split(":").map(Number)
      const medTimeInMinutes = medHour * 60 + medMinute
      const currentTimeInMinutes = currentHour * 60 + currentMinute

      const diffMinutes = medTimeInMinutes - currentTimeInMinutes

      // Enviar lembrete 15 minutos antes
      if (diffMinutes === 15) {
        console.log(`[v0] Sending 15-minute reminder for medication: ${medication.nome}`)
        remindersToSend.push({
          email: medication.email,
          medicationName: medication.nome,
          dosage: medication.dose,
          scheduledTime: medication.horario_uso,
          minutesBefore: 15,
        })
      }

      // Enviar lembrete 5 minutos antes
      if (diffMinutes === 5) {
        console.log(`[v0] Sending 5-minute reminder for medication: ${medication.nome}`)
        remindersToSend.push({
          email: medication.email,
          medicationName: medication.nome,
          dosage: medication.dose,
          scheduledTime: medication.horario_uso,
          minutesBefore: 5,
        })
      }
    }

    // Enviar todos os lembretes
    const results = await Promise.all(
      remindersToSend.map(async (reminder) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-medication-reminder`, {
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
      checked: medications.length,
      sent: successCount,
      results,
    })
  } catch (error: any) {
    console.error("[v0] Error checking medication reminders:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
