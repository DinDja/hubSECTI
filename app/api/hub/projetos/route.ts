import { NextRequest, NextResponse } from "next/server"

const PROJETOS_WORKER = process.env.PROJETOS_WORKER_URL || "https://projetos-secti.obitoandradeuthiha.workers.dev"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 12, 1), 50)
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0)
    const search = (searchParams.get("search") || "").trim().toLowerCase()
    const nocache = searchParams.get("nocache") === "true"

    const cacheControl = nocache
      ? "no-store, no-cache, must-revalidate, max-age=0"
      : "public, max-age=1209600, s-maxage=1209600, stale-while-revalidate=604800"

    const upstream = await fetch(PROJETOS_WORKER, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      return NextResponse.json(
        { error: "Falha ao buscar projetos.", details: text.slice(0, 300) },
        { status: 502 },
      )
    }

    const data = await upstream.json()
    const projetos: Record<string, unknown>[] = data.projetos || []

    const filtered = search
      ? projetos.filter((p) => {
          const text = [p.titulo, p.instituicao, p.unidade, p.responsavel, p.natureza, p.objetivoGeral]
            .filter(Boolean).join(" ").toLowerCase()
          return text.includes(search)
        })
      : projetos

    const total = filtered.length
    const sliced = filtered.slice(offset, offset + limit)

    return NextResponse.json(
      { total, limit, offset, hasMore: offset + limit < total, projetos: sliced },
      {
        status: 200,
        headers: {
          "Cache-Control": cacheControl,
          "X-Hub-Source": "SECTI-firestore",
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    console.error("[api/hub/projetos]", error)
    return NextResponse.json({ error: "Erro ao buscar projetos do SECTI.", details: message }, { status: 502 })
  }
}
