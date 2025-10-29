import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("[v0] Fetching user profile for userId:", userId)

    const users = await sql`
      SELECT 
        id, nome_completo, email, cpf, telefone, data_nascimento,
        endereco_rua, endereco_numero, endereco_complemento, endereco_bairro,
        endereco_cidade, endereco_estado, endereco_cep
      FROM users 
      WHERE id = ${userId}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("[v0] User profile fetched successfully")
    return NextResponse.json({ user: users[0] })
  } catch (error) {
    console.error("[v0] Error fetching user profile:", error)
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const {
      userId,
      nome_completo,
      email,
      telefone,
      endereco_rua,
      endereco_numero,
      endereco_complemento,
      endereco_bairro,
      endereco_cidade,
      endereco_estado,
      endereco_cep,
    } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("[v0] Updating user profile for userId:", userId)

    await sql`
      UPDATE users 
      SET 
        nome_completo = ${nome_completo},
        email = ${email},
        telefone = ${telefone || null},
        endereco_rua = ${endereco_rua || null},
        endereco_numero = ${endereco_numero || null},
        endereco_complemento = ${endereco_complemento || null},
        endereco_bairro = ${endereco_bairro || null},
        endereco_cidade = ${endereco_cidade || null},
        endereco_estado = ${endereco_estado || null},
        endereco_cep = ${endereco_cep || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `

    console.log("[v0] User profile updated successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating user profile:", error)
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }
}
