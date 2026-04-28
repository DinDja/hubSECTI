import { NextResponse } from "next/server"
import { computeConectaCoverage } from "@/lib/conecta-coverage"

const CONECTA_ENDPOINT = "https://conectabahia.netlify.app/.netlify/functions/sharepoint"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const url = new URL(request.url)
  const nocache = url.searchParams.get("nocache") === "true"

  const target = new URL(CONECTA_ENDPOINT)
  target.searchParams.set("filterMode", "ambos")

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
          error: "Resposta invalida ao buscar dados do Conecta Bahia.",
        },
        { status: 502 },
      )
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        {
          error: "Formato inesperado nos dados do Conecta Bahia.",
        },
        { status: 502 },
      )
    }

    const coverage = computeConectaCoverage(data as Record<string, unknown[] | undefined>)

    return NextResponse.json(
      {
        summary: {
          municipalitiesCount: coverage.municipalitiesCount,
          territoriesCount: coverage.territoriesCount,
          installedPointsCount: coverage.installedPointsCount,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "X-Hub-Source": "mapfilter-BA",
        },
      },
    )
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
