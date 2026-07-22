import { NextRequest, NextResponse } from "next/server"
import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore, Timestamp } from "firebase-admin/firestore"

const PUBLIC_FIELDS = [
  "titulo", "natureza", "status", "estadoAtual", "instituicao", "unidade",
  "responsavel", "parceiros", "periodo", "estado", "territorio", "municipio",
  "beneficiarios", "nmrBeneficiarios", "investimentoReal", "paoe",
  "fonteFinanciamento", "localExecucao", "metaFisica", "execucaoFisica",
  "execucaoFinanceira", "objetivoGeral", "objetivosEspecificos", "fotos",
  "updatedAt", "contexto", "problemaDemanda", "justificativa",
  "objetivoGeral", "objetivosEspecificos", "beneficiarios",
  "sustentabilidade", "riscos", "pendencias", "observacoes",
  "recursosHumanos", "recursosMateriais",
  "indicadoresProcesso", "indicadoresResultado",
  "numeroProcessoSEI", "seiNaoSeAplica", "listaInstrumentos",
]

export const dynamic = "force-dynamic"

function getAdminDb() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT nao definida no ambiente.")
  const sa = JSON.parse(raw)
  if (!getApps().length) {
    initializeApp({ credential: cert(sa), projectId: sa.project_id })
  }
  return getFirestore()
}

function toIso(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return value
  return null
}

function mapProjectDetail(doc: FirebaseFirestore.DocumentSnapshot) {
  if (!doc.exists) return null
  const data = doc.data() || {}
  const out: Record<string, unknown> = { id: doc.id }
  for (const field of PUBLIC_FIELDS) {
    if (field === "updatedAt") { out.updatedAt = toIso(data.updatedAt); continue }
    if (data[field] !== undefined) out[field] = data[field]
  }
  return out
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: "ID do projeto obrigatorio." }, { status: 400 })

    const db = getAdminDb()
    const doc = await db.collection("projects").doc(id).get()
    const projeto = mapProjectDetail(doc)

    if (!projeto) return NextResponse.json({ error: "Projeto nao encontrado." }, { status: 404 })

    return NextResponse.json(projeto, {
      status: 200,
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300", "X-Hub-Source": "SECTI-firestore" },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    console.error("[api/hub/projetos/id]", error)
    return NextResponse.json({ error: "Erro ao buscar projeto.", details: message }, { status: 502 })
  }
}
