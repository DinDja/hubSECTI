import { NextResponse } from "next/server"

const TERRITORIOS_ENDPOINT = "https://secti-territorios.netlify.app/.netlify/functions/sharepoint"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const url = new URL(request.url)
  const nocache = url.searchParams.get("nocache") === "true"

  const target = new URL(TERRITORIOS_ENDPOINT)
  target.searchParams.set("modelo", "territorial")

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
          error: "Falha ao buscar dados de SECTI Territórios.",
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
          error: "Resposta inválida ao buscar dados de SECTI Territórios.",
        },
        { status: 502 },
      )
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "X-Hub-Source": "SECTI_TERRITORIOS",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"

    return NextResponse.json(
      {
        error: "Erro ao conectar com o endpoint de SECTI Territórios.",
        details: message,
      },
      { status: 502 },
    )
  }
}
