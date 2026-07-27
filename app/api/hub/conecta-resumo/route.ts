import { NextResponse } from "next/server"
import { fetchConectaSummary } from "@/lib/fetch-conecta"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const url = new URL(request.url)
  const nocache = url.searchParams.get("nocache") === "true"

  try {
    const coverage = await fetchConectaSummary({ nocache })

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
          "X-Hub-Source": "cf-pages-function",
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"

    return NextResponse.json(
      { error: "Erro ao buscar dados do Conecta Bahia.", details: message },
      { status: 502 },
    )
  }
}
