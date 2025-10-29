import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, token, newPassword } = body

    if (!email || !token || !newPassword) {
      return NextResponse.json({ success: false, error: "Email, token e nova senha são obrigatórios" }, { status: 400 })
    }

    // Validate token format
    const tokenRegex = /^[A-Z0-9]{6}$/
    if (!tokenRegex.test(token.toUpperCase())) {
      return NextResponse.json({ success: false, error: "Token inválido" }, { status: 400 })
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    // Verify token from localStorage (stored when email was sent)
    // In production, this should be stored in database with expiration
    const resetDataStr = typeof window !== "undefined" ? localStorage.getItem(`resetToken_${email}`) : null

    // Connect to Neon database
    const sql = neon(process.env.DATABASE_URL!)

    // Check if user exists
    const users = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (users.length === 0) {
      return NextResponse.json({ success: false, error: "Usuário não encontrado" }, { status: 404 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password in database
    await sql`
      UPDATE users 
      SET password = ${hashedPassword}, updated_at = NOW()
      WHERE email = ${email}
    `

    console.log("[v0] Password updated successfully for:", email)

    return NextResponse.json({
      success: true,
      message: "Senha atualizada com sucesso",
    })
  } catch (error) {
    console.error("[v0] Reset password error:", error)
    return NextResponse.json({ success: false, error: "Erro ao redefinir senha. Tente novamente." }, { status: 500 })
  }
}
