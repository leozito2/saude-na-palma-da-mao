import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, tipo_consulta, nome_medico, especialidade, data_consulta, horario_consulta, local_consulta } =
      await request.json()

    if (!email || !data_consulta || !horario_consulta) {
      return NextResponse.json({ success: false, error: "Dados incompletos" }, { status: 400 })
    }

    const appointmentDateTime = new Date(`${data_consulta}T${horario_consulta}`)
    const reminder24h = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000)
    const reminder12h = new Date(appointmentDateTime.getTime() - 12 * 60 * 60 * 1000)
    const now = new Date()

    const reminders = []

    // Enviar lembrete de 24 horas se ainda não passou
    if (reminder24h > now) {
      const timeUntil24h = reminder24h.getTime() - now.getTime()
      setTimeout(async () => {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/send-appointment-reminder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              tipo_consulta,
              nome_medico,
              especialidade,
              data_consulta,
              horario_consulta,
              local_consulta,
              hoursBefore: 24,
            }),
          })
        } catch (error) {
          console.error("[v0] Error sending 24h reminder:", error)
        }
      }, timeUntil24h)
      reminders.push({ time: reminder24h.toISOString(), hoursBefore: 24 })
    }

    // Enviar lembrete de 12 horas se ainda não passou
    if (reminder12h > now) {
      const timeUntil12h = reminder12h.getTime() - now.getTime()
      setTimeout(async () => {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/send-appointment-reminder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              tipo_consulta,
              nome_medico,
              especialidade,
              data_consulta,
              horario_consulta,
              local_consulta,
              hoursBefore: 12,
            }),
          })
        } catch (error) {
          console.error("[v0] Error sending 12h reminder:", error)
        }
      }, timeUntil12h)
      reminders.push({ time: reminder12h.toISOString(), hoursBefore: 12 })
    }

    console.log("[v0] Appointment reminders scheduled:", reminders)
    return NextResponse.json({
      success: true,
      reminders,
      message: `${reminders.length} lembrete(s) agendado(s)`,
    })
  } catch (error: any) {
    console.error("[v0] Error scheduling appointment reminders:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
