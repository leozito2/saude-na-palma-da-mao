import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome_completo, email, password, cpf, sexo, endereco_completo, data_nascimento, telefone } = body

    // Validate required fields
    if (!nome_completo || !email || !password || !cpf || !sexo || !endereco_completo || !data_nascimento) {
      return NextResponse.json(
        { success: false, error: "Todos os campos obrigatórios devem ser preenchidos" },
        { status: 400 },
      )
    }

    // Connect to Neon database
    const sql = neon(process.env.DATABASE_URL!)

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email} OR cpf = ${cpf}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ success: false, error: "Usuário já existe com este email ou CPF" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert new user with hashed password
    const result = await sql`
      INSERT INTO users (nome_completo, email, password, cpf, sexo, endereco_completo, data_nascimento, telefone, created_at, updated_at)
      VALUES (${nome_completo}, ${email}, ${hashedPassword}, ${cpf}, ${sexo}, ${endereco_completo}, ${data_nascimento}, ${telefone || null}, NOW(), NOW())
      RETURNING id, nome_completo, email, cpf, sexo, endereco_completo, data_nascimento, telefone, created_at
    `

    const user = result[0]

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
    console.error("Registration error:", error)
    return NextResponse.json({ success: false, error: "Erro ao criar conta. Tente novamente." }, { status: 500 })
  }
}
