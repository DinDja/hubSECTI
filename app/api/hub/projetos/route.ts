import { NextResponse } from "next/server"
import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

const PUBLIC_FIELDS = [
  "titulo",
  "natureza",
  "status",
  "estadoAtual",
  "instituicao",
  "unidade",
  "responsavel",
  "parceiros",
  "periodo",
  "estado",
  "territorio",
  "municipio",
  "beneficiarios",
  "nmrBeneficiarios",
  "investimentoReal",
  "paoe",
  "fonteFinanciamento",
  "localExecucao",
  "metaFisica",
  "execucaoFisica",
  "execucaoFinanceira",
  "objetivoGeral",
  "objetivosEspecificos",
  "updatedAt",
]

export const dynamic = "force-dynamic"
export const revalidate = 0

function getAdminDb() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT nao definida no ambiente.")
  }

  const serviceAccount = JSON.parse(raw)

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    })
  }

  return getFirestore()
}

function toIso(value: unknown): string | null {
  if (!value) return null
  if (value && typeof (value as Record<string, unknown>).toDate === "function") {
    return (value as FirebaseFirestore.Timestamp).toDate().toISOString()
  }
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return value
  return null
}

function mapPublicProject(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = doc.data() || {}
  const out: Record<string, unknown> = { id: doc.id }

  for (const field of PUBLIC_FIELDS) {
    if (field === "updatedAt") {
      out.updatedAt = toIso(data.updatedAt)
      continue
    }
    if (data[field] !== undefined) {
      out[field] = data[field]
    }
  }

  return out
}

export async function GET() {
  try {
    const db = getAdminDb()
    const snap = await db.collection("projects").get()
    const projetos = snap.docs.map(mapPublicProject)

    return NextResponse.json(
      { total: projetos.length, projetos },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
          "X-Hub-Source": "SECTI-firestore",
        },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    console.error("[api/hub/projetos]", error)

    return NextResponse.json(
      { error: "Erro ao buscar projetos do SECTI.", details: message },
      { status: 502 }
    )
  }
}
