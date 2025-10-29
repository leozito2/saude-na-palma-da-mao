import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { medicationId, userId } = await request.json()

    console.log("[v0] Recording intake for medication:", medicationId, "user:", userId)

    if (!medicationId || !userId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Record the intake
    await sql`
      INSERT INTO medication_intakes (medication_id, user_id, taken_at)
      VALUES (${medicationId}, ${userId}, NOW())
    `

    console.log("[v0] Intake recorded successfully")

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Error recording intake:", error)
    return Response.json({ error: "Failed to record intake" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const medicationId = searchParams.get("medicationId")
    const userId = searchParams.get("userId")

    if (!medicationId || !userId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get today's intakes for this medication
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const intakes = await sql`
      SELECT * FROM medication_intakes
      WHERE medication_id = ${medicationId}
        AND user_id = ${userId}
        AND taken_at >= ${today.toISOString()}
        AND taken_at < ${tomorrow.toISOString()}
      ORDER BY taken_at DESC
    `

    console.log("[v0] Intakes today:", intakes.length)

    return Response.json({ intakes })
  } catch (error) {
    console.error("[v0] Error fetching intakes:", error)
    return Response.json({ error: "Failed to fetch intakes" }, { status: 500 })
  }
}
