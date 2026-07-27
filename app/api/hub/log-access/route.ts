import { NextResponse } from "next/server"

const LOG_ACCESS_WORKER = process.env.LOG_ACCESS_WORKER_URL || "https://log-access.seusubdominio.workers.dev"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const upstream = await fetch(LOG_ACCESS_WORKER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (error) {
    console.error("Failed to proxy log access:", error)
    return NextResponse.json({ error: "Failed to log access" }, { status: 500 })
  }
}
