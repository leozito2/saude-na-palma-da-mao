import { type NextRequest, NextResponse } from "next/server"

async function getVerifiedSender() {
  try {
    const response = await fetch("https://api.brevo.com/v3/senders", {
      method: "GET",
      headers: {
        "api-key": "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",
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.senders && data.senders.length > 0) {
        const verifiedSender = data.senders.find((s: any) => s.active)
        if (verifiedSender) {
          return {
            name: verifiedSender.name || "MedCare",
            email: verifiedSender.email,
          }
        }
      }
    }
  } catch (error) {
    console.error("[v0] Error fetching senders:", error)
  }

  return {
    name: "MedCare",
    email: "noreply@medcare.com",
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userEmail, tipo_consulta, nome_medico, especialidade, data_consulta, horario_consulta, local_consulta } =
      await request.json()

    if (!userEmail) {
      return NextResponse.json({ error: "Email do usuário é obrigatório" }, { status: 400 })
    }

    const sender = await getVerifiedSender()

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": "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",
      },
      body: JSON.stringify({
        sender: sender,
        to: [{ email: userEmail, name: "Usuário MedCare" }],
        subject: "✅ Consulta Agendada com Sucesso - MedCare",
        htmlContent: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: linear-gradient(135deg, #EFF6FF 0%, #D1FAE5 100%);">
              <div style="max-width: 600px; margin: 40px auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%); padding: 30px; border-radius: 20px 20px 0 0; text-align: center;">
                  <div style="background: white; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: inline-flex; align-items: center; justify-content: center;">
                    <span style="font-size: 30px;">🏥</span>
                  </div>
                  <h1 style="color: white; margin: 0; font-size: 28px;">MedCare</h1>
                </div>
                
                <div style="background: white; padding: 40px; border-radius: 0 0 20px 20px;">
                  <h2 style="color: #1F2937; margin: 0 0 20px 0; font-size: 24px;">✅ Consulta Agendada!</h2>
                  
                  <p style="color: #4B5563; line-height: 1.6; margin: 0 0 20px 0;">
                    Sua consulta foi agendada com sucesso! Confira os detalhes abaixo:
                  </p>
                  
                  <div style="background: #F3F4F6; border-radius: 12px; padding: 20px; margin: 0 0 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">📋 Tipo:</td>
                        <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">${tipo_consulta}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">👨‍⚕️ Médico:</td>
                        <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">Dr. ${nome_medico}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">🏥 Especialidade:</td>
                        <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">${especialidade}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">📅 Data:</td>
                        <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">${formatDate(data_consulta)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">⏰ Horário:</td>
                        <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">${horario_consulta}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">📍 Local:</td>
                        <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">${local_consulta}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="background: #DBEAFE; border-left: 4px solid #3B82F6; padding: 15px; border-radius: 8px; margin: 0 0 20px 0;">
                    <p style="color: #1E40AF; font-size: 13px; margin: 0; line-height: 1.5;">
                      💡 <strong>Lembrete:</strong> Você receberá notificações 24 horas e 12 horas antes da consulta.
                    </p>
                  </div>
                  
                  <p style="color: #6B7280; font-size: 13px; text-align: center; margin: 20px 0 0 0;">
                    © 2025 MedCare - Sistema de Gerenciamento de Saúde
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
      return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error sending appointment confirmation:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
