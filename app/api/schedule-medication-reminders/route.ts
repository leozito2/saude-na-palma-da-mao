import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, medicationName, dosage, scheduledDate, scheduledTime, duracao_dias, frequencia_diaria } =
      await request.json()

    if (!email || !medicationName || !scheduledDate || !scheduledTime) {
      return NextResponse.json({ success: false, error: "Dados incompletos" }, { status: 400 })
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
    const reminder15min = new Date(scheduledDateTime.getTime() - 15 * 60 * 1000)
    const reminder5min = new Date(scheduledDateTime.getTime() - 5 * 60 * 1000)
    const now = new Date()

    const reminders = []

    // Enviar lembrete de 15 minutos se ainda não passou
    if (reminder15min > now) {
      const timeUntil15 = reminder15min.getTime() - now.getTime()
      setTimeout(async () => {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/send-medication-reminder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              medicationName,
              dosage,
              scheduledTime,
              minutesBefore: 15,
            }),
          })
        } catch (error) {
          console.error("[v0] Error sending 15min reminder:", error)
        }
      }, timeUntil15)
      reminders.push({ time: reminder15min.toISOString(), minutesBefore: 15 })
    }

    // Enviar lembrete de 5 minutos se ainda não passou
    if (reminder5min > now) {
      const timeUntil5 = reminder5min.getTime() - now.getTime()
      setTimeout(async () => {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/send-medication-reminder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              medicationName,
              dosage,
              scheduledTime,
              minutesBefore: 5,
            }),
          })
        } catch (error) {
          console.error("[v0] Error sending 5min reminder:", error)
        }
      }, timeUntil5)
      reminders.push({ time: reminder5min.toISOString(), minutesBefore: 5 })
    }

    console.log("[v0] Medication reminders scheduled:", reminders)
    return NextResponse.json({
      success: true,
      reminders,
      message: `${reminders.length} lembrete(s) agendado(s)`,
    })
  } catch (error: any) {
    console.error("[v0] Error scheduling medication reminders:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
