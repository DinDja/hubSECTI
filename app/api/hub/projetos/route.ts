import { NextResponse } from "next/server"

// Proxy para a Netlify Function `projetos-secti`.
// A função lê o Firestore via firebase-admin (conta de serviço) e retorna
// metadados públicos dos projetos do sistema SECTI.
const PROJETOS_ENDPOINT =
  process.env.NETLIFY_PROJETOS_ENDPOINT ||
  "https://hub.secti.ba.gov.br/.netlify/functions/projetos-secti"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const url = new URL(request.url)
  const nocache = url.searchParams.get("nocache") === "true"

  const target = new URL(PROJETOS_ENDPOINT)
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
          error: "Falha ao buscar projetos do SECTI.",
          status: upstream.status,
          details: payload.slice(0, 300),
        },
        { status: 502 }
      )
    }

    let data: unknown

    try {
      data = JSON.parse(payload)
    } catch {
      return NextResponse.json(
        {
          error: "Resposta inválida ao buscar projetos do SECTI.",
        },
        { status: 502 }
      )
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "X-Hub-Source": "SECTI-firestore",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"

    return NextResponse.json(
      {
        error: "Erro ao conectar com o endpoint de projetos do SECTI.",
        details: message,
      },
      { status: 502 }
    )
  }
}
