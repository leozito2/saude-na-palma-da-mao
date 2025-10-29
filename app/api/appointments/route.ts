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

    const appointments = await sql`
      SELECT * FROM appointments 
      WHERE user_id = ${userId}
      ORDER BY data_consulta DESC, horario_consulta DESC
    `

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      userId,
      tipo_consulta,
      nome_medico,
      especialidade,
      data_consulta,
      horario_consulta,
      local_consulta,
      observacoes,
    } = body

    if (
      !userId ||
      !tipo_consulta ||
      !nome_medico ||
      !especialidade ||
      !data_consulta ||
      !horario_consulta ||
      !local_consulta
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO appointments (user_id, tipo_consulta, nome_medico, especialidade, data_consulta, horario_consulta, local_consulta, observacoes)
      VALUES (${userId}, ${tipo_consulta}, ${nome_medico}, ${especialidade}, ${data_consulta}, ${horario_consulta}, ${local_consulta}, ${observacoes || ""})
      RETURNING *
    `

    return NextResponse.json({ success: true, appointment: result[0] })
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, userId, ...updates } = body

    if (!id || !userId) {
      return NextResponse.json({ error: "ID and User ID are required" }, { status: 400 })
    }

    const updateFields = Object.keys(updates)
      .map((key) => `${key} = $${key}`)
      .join(", ")

    const result = await sql`
      UPDATE appointments 
      SET ${sql(updates)}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, appointment: result[0] })
  } catch (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 })
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
      DELETE FROM appointments 
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting appointment:", error)
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 500 })
  }
}
