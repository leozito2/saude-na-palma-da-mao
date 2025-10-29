import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Connect to Neon database
    const sql = neon(process.env.DATABASE_URL!)

    const users = await sql`
      SELECT id, nome_completo, email, cpf, sexo, endereco_completo, data_nascimento, telefone, password, created_at
      FROM users
      WHERE email = ${email}
    `

    if (users.length === 0) {
      return NextResponse.json({ success: false, error: "Email ou senha incorretos" }, { status: 401 })
    }

    const user = users[0]

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json({ success: false, error: "Email ou senha incorretos" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id.toString(),
        nome_completo: user.nome_completo,
        email: user.email,
        cpf: user.cpf,
        sexo: user.sexo,
        endereco_completo: user.endereco_completo,
        data_nascimento: user.data_nascimento,
        telefone: user.telefone,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, error: "Erro ao fazer login. Tente novamente." }, { status: 500 })
  }
}
