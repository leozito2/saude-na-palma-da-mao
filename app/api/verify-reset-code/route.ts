import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email e código são obrigatórios" }, { status: 400 })
    }

    // Validate code format (6 alphanumeric characters)
    const codeRegex = /^[A-Z0-9]{6}$/
    if (!codeRegex.test(code.toUpperCase())) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 })
    }

    // In a real app, this would check a database
    // For now, we'll accept any code that matches the regex
    return NextResponse.json({
      success: true,
      message: "Código verificado com sucesso",
    })
  } catch (error: any) {
    console.error("Error in verify-reset-code:", error)
    return NextResponse.json({ error: error.message || "Erro ao verificar código" }, { status: 500 })
  }
}
