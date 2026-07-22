import { NextRequest, NextResponse } from "next/server"
import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore, Timestamp } from "firebase-admin/firestore"

const PUBLIC_FIELDS = [
  "titulo", "natureza", "status", "estadoAtual", "instituicao", "unidade",
  "responsavel", "parceiros", "periodo", "estado", "territorio", "municipio",
  "beneficiarios", "nmrBeneficiarios", "investimentoReal", "paoe",
  "fonteFinanciamento", "localExecucao", "metaFisica", "execucaoFisica",
  "execucaoFinanceira", "objetivoGeral", "objetivosEspecificos", "fotos",
  "updatedAt",
]

export const dynamic = "force-dynamic"
export const revalidate = 0

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

function mapPublicProject(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = doc.data() || {}
  const out: Record<string, unknown> = { id: doc.id }
  for (const field of PUBLIC_FIELDS) {
    if (field === "updatedAt") { out.updatedAt = toIso(data.updatedAt); continue }
    if (data[field] !== undefined) out[field] = data[field]
  }
  return out
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 12, 1), 50)
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0)
    const search = (searchParams.get("search") || "").trim().toLowerCase()

    const db = getAdminDb()
    let query: FirebaseFirestore.Query = db.collection("projects").orderBy("updatedAt", "desc")

    // Count total (with optional search filter)
    let total = 0
    if (search) {
      // Fetch all matching, count server-side
      const all = await query.get()
      const allProjects = all.docs.map(mapPublicProject).filter((p) => {
        const text = [p.titulo, p.instituicao, p.unidade, p.responsavel, p.natureza, p.objetivoGeral]
          .filter(Boolean).join(" ").toLowerCase()
        return text.includes(search)
      })
      total = allProjects.length
      const sliced = allProjects.slice(offset, offset + limit)
      return NextResponse.json({ total, limit, offset, hasMore: offset + limit < total, projetos: sliced }, {
        status: 200,
        headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=600", "X-Hub-Source": "SECTI-firestore" },
      })
    }

    const countSnap = await query.get()
    total = countSnap.size

    query = query.limit(limit).offset(offset)
    const snap = await query.get()
    const projetos = snap.docs.map(mapPublicProject)

    return NextResponse.json(
      { total, limit, offset, hasMore: offset + limit < total, projetos },
      {
        status: 200,
        headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=600", "X-Hub-Source": "SECTI-firestore" },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    console.error("[api/hub/projetos]", error)
    return NextResponse.json({ error: "Erro ao buscar projetos do SECTI.", details: message }, { status: 502 })
  }
}
