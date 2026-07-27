import { NextResponse } from "next/server"
import { fetchConectaData } from "@/lib/fetch-conecta"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function logAccess(ip: string, path: string, userAgent: string) {
  try {
    await fetch(process.env.LOG_ACCESS_URL || "/api/hub/log-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, path, userAgent, timestamp: new Date().toISOString() }),
      keepalive: true,
    })
  } catch (error) {
    console.error("Failed to log access:", error)
  }
}

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"

  await logAccess(ip, "/api/hub/conecta", userAgent)

  const url = new URL(request.url)
  const nocache = url.searchParams.get("nocache") === "true"

  try {
    const data = await fetchConectaData({ nocache })

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "X-Hub-Source": "cf-pages-function",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"

    return NextResponse.json(
      { error: "Erro ao buscar dados do Conecta Bahia.", details: message },
      { status: 502 },
    )
  }
}
