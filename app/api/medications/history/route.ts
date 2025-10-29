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

    const history = await sql`
      SELECT * FROM medications_history 
      WHERE user_id = ${userId}
      ORDER BY movido_para_historico_em DESC
    `

    return NextResponse.json({ history })
  } catch (error) {
    console.error("Error fetching medication history:", error)
    return NextResponse.json({ error: "Failed to fetch medication history" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { medicationId, userId, motivo } = body

    if (!medicationId || !userId || !motivo) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get medication data
    const medication = await sql`
      SELECT * FROM medications WHERE id = ${medicationId} AND user_id = ${userId}
    `

    if (medication.length === 0) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 })
    }

    const med = medication[0]

    // Insert into history
    await sql`
      INSERT INTO medications_history (medication_id, user_id, nome, principio_ativo, tipo, dose, horario_uso, data_vencimento, motivo, created_at)
      VALUES (${med.id}, ${med.user_id}, ${med.nome}, ${med.principio_ativo}, ${med.tipo}, ${med.dose}, ${med.horario_uso}, ${med.data_vencimento}, ${motivo}, ${med.created_at})
    `

    // Delete from active medications
    await sql`
      DELETE FROM medications WHERE id = ${medicationId} AND user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error moving medication to history:", error)
    return NextResponse.json({ error: "Failed to move medication to history" }, { status: 500 })
  }
}
