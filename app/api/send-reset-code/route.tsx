import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

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
        // Return the first verified sender
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

  // Fallback to a default sender
  return {
    name: "MedCare",
    email: "noreply@medcare.com",
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

    try {
      const users = await sql`SELECT email, nome_completo FROM users WHERE email = ${email}`

      if (users.length === 0) {
        return NextResponse.json(
          {
            error: "Email não cadastrado no sistema. Por favor, verifique o email ou crie uma conta.",
          },
          { status: 404 },
        )
      }
    } catch (dbError) {
      console.error("[v0] Database error:", dbError)
      return NextResponse.json(
        {
          error: "Erro ao verificar email no banco de dados",
        },
        { status: 500 },
      )
    }

    // Generate 6-character alphanumeric code matching regex
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const resetData = {
      token: code,
      email,
      used: false,
    }

    try {
      const sender = await getVerifiedSender()
      console.log("[v0] Using sender:", sender)

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": "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",
        },
        body: JSON.stringify({
          sender: sender,
          to: [
            {
              email: email,
              name: "Usuário MedCare",
            },
          ],
          subject: "🔐 Recuperação de Senha - MedCare",
          htmlContent: `
            <!DOCTYPE html>
            <html lang="pt-BR">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Recuperação de Senha - MedCare</title>
              </head>
              <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #EFF6FF 0%, #D1FAE5 100%); min-height: 100vh;">
                <div style="max-width: 600px; margin: 40px auto; padding: 20px;">
                   Header 
                  <div style="background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%); padding: 40px 30px; border-radius: 20px 20px 0 0; text-align: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);">
                    <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                      <span style="font-size: 40px;">🏥</span>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">MedCare</h1>
                    <p style="color: rgba(255, 255, 255, 0.95); margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">Sistema de Gerenciamento de Saúde</p>
                  </div>
                  
                   Content 
                  <div style="background: white; padding: 50px 40px; border-radius: 0 0 20px 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #1F2937; margin: 0 0 24px 0; font-size: 28px; font-weight: bold;">🔐 Recuperação de Senha</h2>
                    
                    <p style="color: #4B5563; line-height: 1.8; margin: 0 0 24px 0; font-size: 16px;">
                      Olá! 👋
                    </p>
                    
                    <p style="color: #4B5563; line-height: 1.8; margin: 0 0 24px 0; font-size: 16px;">
                      Recebemos uma solicitação para <strong>redefinir a senha</strong> da sua conta no MedCare. 
                      Para sua segurança, geramos um código único de verificação.
                    </p>
                    
                    <p style="color: #4B5563; line-height: 1.8; margin: 0 0 32px 0; font-size: 16px;">
                      Use o código abaixo para criar uma nova senha:
                    </p>
                    
                     Code Box - Simplified for mobile 
                    <div style="background: #F3F4F6; border: 2px solid #3B82F6; border-radius: 12px; padding: 30px 20px; text-align: center; margin: 0 0 32px 0;">
                      <p style="color: #6B7280; font-size: 13px; margin: 0 0 10px 0; font-weight: 600;">SEU CÓDIGO DE VERIFICAÇÃO</p>
                      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1F2937; font-family: monospace; background: white; padding: 15px; border-radius: 8px; display: inline-block;">
                        ${code}
                      </div>
                      <p style="color: #6B7280; font-size: 12px; margin: 12px 0 0 0;">Digite este código na página de recuperação</p>
                    </div>
                    
                     Instructions 
                    <div style="background: #F9FAFB; border-left: 4px solid #3B82F6; padding: 20px; border-radius: 8px; margin: 0 0 32px 0;">
                      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0; font-weight: 600;">
                        📋 Instruções:
                      </p>
                      <ol style="color: #4B5563; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                        <li>Acesse a página de recuperação de senha</li>
                        <li>Digite o código de 6 caracteres acima</li>
                        <li>Crie sua nova senha</li>
                        <li>Faça login com suas novas credenciais</li>
                      </ol>
                    </div>
                    
                     Security Notice 
                    <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 0 0 32px 0;">
                      <p style="color: #92400E; font-size: 13px; line-height: 1.6; margin: 0;">
                        <strong>⚠️ Importante:</strong> Se você não solicitou a recuperação de senha, ignore este email. 
                        Sua senha permanecerá inalterada e sua conta está segura.
                      </p>
                    </div>
                    
                    <hr style="border: none; border-top: 2px solid #E5E7EB; margin: 32px 0;">
                    
                     Footer 
                    <div style="text-align: center;">
                      <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0;">
                        © 2025 MedCare - Sistema de Gerenciamento de Saúde
                      </p>
                      <p style="color: #9CA3AF; font-size: 12px; line-height: 1.6; margin: 0;">
                        Este é um email automático, por favor não responda.<br>
                        Em caso de dúvidas, entre em contato com nosso suporte.
                      </p>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error("[v0] Brevo API error:", responseData)
        return NextResponse.json({
          success: true,
          message: `Código gerado: ${code} (Email não enviado - ${responseData.message || "erro desconhecido"})`,
          resetData,
          testMode: true,
          error: responseData,
        })
      }

      console.log("[v0] Email sent successfully via Brevo")
      return NextResponse.json({
        success: true,
        message: "Código enviado para o email cadastrado",
        resetData,
      })
    } catch (emailError: any) {
      console.error("[v0] Brevo email error:", emailError.message)

      return NextResponse.json({
        success: true,
        message: `Código gerado: ${code} (Modo teste - email não enviado)`,
        resetData,
        testMode: true,
      })
    }
  } catch (error: any) {
    console.error("[v0] Error in send-reset-code:", error)
    return NextResponse.json({ error: error.message || "Erro ao enviar código" }, { status: 500 })
  }
}
