import { NextResponse } from "next/server"

async function getVerifiedSender() {
  try {
    const response = await fetch("https://api.brevo.com/v3/senders", {
      method: "GET",
      headers: {
        "api-key": process.env.BREVO_API_KEY || "",
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.senders && data.senders.length > 0) {
        const verifiedSender = data.senders.find((s: any) => s.active)
        if (verifiedSender) {
          return {
            name: verifiedSender.name || "Saúde Na Palma da Mão",
            email: verifiedSender.email,
          }
        }
      }
    }
  } catch (error) {
    console.error("[v0] Error fetching senders:", error)
  }

  return {
    name: "Saúde Na Palma da Mão",
    email: "noreply@saudenapalmadamao.com",
  }
}

export async function POST(request: Request) {
  try {
    const {
      email,
      tipo_consulta,
      nome_medico,
      especialidade,
      data_consulta,
      horario_consulta,
      local_consulta,
      hoursBefore,
    } = await request.json()

    if (!email || !data_consulta || !horario_consulta) {
      return NextResponse.json({ success: false, error: "Dados incompletos" }, { status: 400 })
    }

    const sender = await getVerifiedSender()
    console.log("[v0] Using sender for appointment reminder:", sender)

    const formatDate = (dateString: string) => {
      const [year, month, day] = dateString.split("T")[0].split("-")
      const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))

      return date.toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }

    const timeLeft = "1 hora"

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY || "",
      },
      body: JSON.stringify({
        sender: sender,
        to: [
          {
            email: email,
          },
        ],
        subject: `⏰ Lembrete de Consulta - ${nome_medico}`,
        htmlContent: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🏥 Saúde Na Palma da Mão</h1>
                  <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Sistema de Gerenciamento de Saúde</p>
                </div>
                
                <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 64px; margin-bottom: 10px;">🩺</div>
                    <h2 style="color: #1f2937; margin: 0; font-size: 24px;">Lembrete de Consulta</h2>
                  </div>
                  
                  <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                    Olá! Sua consulta está se aproximando. Não se esqueça de comparecer!
                  </p>
                  
                  <div style="background: linear-gradient(135deg, #eff6ff 0%, #d1fae5 100%); border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 0 0 20px 0;">
                    <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>📋 Tipo:</strong> ${tipo_consulta}</p>
                    <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>👨‍⚕️ Médico:</strong> ${nome_medico}</p>
                    <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>🏥 Especialidade:</strong> ${especialidade}</p>
                    <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>📅 Data:</strong> ${formatDate(data_consulta)}</p>
                    <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>🕐 Horário:</strong> ${horario_consulta}</p>
                    <p style="margin: 0; color: #1f2937;"><strong>📍 Local:</strong> ${local_consulta}</p>
                  </div>
                  
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; border-radius: 25px; text-align: center; font-weight: bold; font-size: 18px; margin: 0 0 30px 0;">
                    ⏰ Falta ${timeLeft}
                  </div>
                  
                  <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 0 0 20px 0;">
                    <p style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.5;">
                      <strong>💡 Dica:</strong> Lembre-se de chegar com antecedência, levar seus documentos e exames anteriores. Se precisar remarcar, entre em contato com antecedência.
                    </p>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                    Este é um lembrete automático do seu aplicativo Saúde Na Palma da Mão. Para gerenciar suas consultas, acesse o aplicativo.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  
                  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                    © 2025 Saúde Na Palma da Mão - Cuidando da sua saúde<br>
                    Este é um email automático, por favor não responda.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Brevo API error:", errorData)
      throw new Error(`Brevo API error: ${errorData.message || response.statusText}`)
    }

    const result = await response.json()
    console.log("[v0] Appointment reminder sent successfully")
    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error: any) {
    console.error("[v0] Brevo email error:", error)
    return NextResponse.json({ success: false, error: "Erro ao enviar lembrete" }, { status: 500 })
  }
}
