import { NextResponse } from "next/server"

const CONECTA_ENDPOINT = "https://conectabahia.netlify.app/.netlify/functions/sharepoint"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function logAccess(ip: string, path: string, userAgent: string) {
  try {
    await fetch("/.netlify/functions/log-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ip,
        path,
        userAgent,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    })
  } catch (error) {
    console.error("Failed to log access:", error)
  }
}

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown"
  
  const userAgent = request.headers.get("user-agent") || "unknown"
  
  await logAccess(ip, "/api/hub/conecta", userAgent)
  const url = new URL(request.url)
  const filterMode = url.searchParams.get("filterMode") || "ambos"
  const nocache = url.searchParams.get("nocache") === "true"

  const target = new URL(CONECTA_ENDPOINT)
  target.searchParams.set("filterMode", filterMode)

  if (nocache) {
    target.searchParams.set("nocache", "true")
  }

  try {
    const upstream = await fetch(target.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    })

    const payload = await upstream.text()

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: "Falha ao buscar dados do Conecta Bahia.",
          status: upstream.status,
          details: payload.slice(0, 300),
        },
        { status: 502 },
      )
    }

    let data: unknown

    try {
      data = JSON.parse(payload)
    } catch {
      return NextResponse.json(
        {
          error: "Resposta inválida ao buscar dados do Conecta Bahia.",
        },
        { status: 502 },
      )
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "X-Hub-Source": "mapfilter-BA",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"

    return NextResponse.json(
      {
        error: "Erro ao conectar com o endpoint do Conecta Bahia.",
        details: message,
      },
      { status: 502 },
    )
  }
}
