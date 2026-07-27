import { NextRequest, NextResponse } from "next/server"

const PROJETOS_WORKER = process.env.PROJETOS_WORKER_URL || "https://projetos-secti.obitoandradeuthiha.workers.dev"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: "ID do projeto obrigatorio." }, { status: 400 })

    const upstream = await fetch(PROJETOS_WORKER, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    })

    if (!upstream.ok) {
      return NextResponse.json({ error: "Falha ao buscar projetos." }, { status: 502 })
    }

    const data = await upstream.json()
    const projetos: Record<string, unknown>[] = data.projetos || []
    const projeto = projetos.find((p) => p.id === id)

    if (!projeto) {
      return NextResponse.json({ error: "Projeto nao encontrado." }, { status: 404 })
    }

    return NextResponse.json(projeto, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=1209600, s-maxage=1209600, stale-while-revalidate=604800",
        "X-Hub-Source": "SECTI-firestore",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    console.error("[api/hub/projetos/id]", error)
    return NextResponse.json({ error: "Erro ao buscar projeto.", details: message }, { status: 502 })
  }
}
