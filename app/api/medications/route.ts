import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const medications = await sql`
      SELECT * FROM medications 
      WHERE user_id = ${userId} AND ativo = true
      ORDER BY created_at DESC
    `

    return NextResponse.json({ medications })
  } catch (error) {
    console.error("Error fetching medications:", error)
    return NextResponse.json({ error: "Failed to fetch medications" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, nome, principio_ativo, tipo, dose, horario_uso, data_vencimento, duracao_dias, frequencia_diaria } =
      body

    if (!userId || !nome || !tipo || !dose || !horario_uso || !data_vencimento) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO medications (user_id, nome, principio_ativo, tipo, dose, horario_uso, data_vencimento, duracao_dias, frequencia_diaria)
      VALUES (${userId}, ${nome}, ${principio_ativo || ""}, ${tipo}, ${dose}, ${horario_uso}, ${data_vencimento}, ${duracao_dias || null}, ${frequencia_diaria || 1})
      RETURNING *
    `

    return NextResponse.json({ success: true, medication: result[0] })
  } catch (error) {
    console.error("Error creating medication:", error)
    return NextResponse.json({ error: "Failed to create medication" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const {
      id,
      userId,
      nome,
      principio_ativo,
      tipo,
      dose,
      horario_uso,
      data_vencimento,
      duracao_dias,
      frequencia_diaria,
    } = body

    if (!id || !userId) {
      return NextResponse.json({ error: "ID and User ID are required" }, { status: 400 })
    }

    const result = await sql`
      UPDATE medications 
      SET 
        nome = ${nome},
        principio_ativo = ${principio_ativo || ""},
        tipo = ${tipo},
        dose = ${dose},
        horario_uso = ${horario_uso},
        data_vencimento = ${data_vencimento},
        duracao_dias = ${duracao_dias || null},
        frequencia_diaria = ${frequencia_diaria || 1},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, medication: result[0] })
  } catch (error) {
    console.error("Error updating medication:", error)
    return NextResponse.json({ error: "Failed to update medication" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const userId = searchParams.get("userId")

    if (!id || !userId) {
      return NextResponse.json({ error: "ID and User ID are required" }, { status: 400 })
    }

    const result = await sql`
      DELETE FROM medications 
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting medication:", error)
    return NextResponse.json({ error: "Failed to delete medication" }, { status: 500 })
  }
}
