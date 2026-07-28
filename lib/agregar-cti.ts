import ctiData from "@/lib/dados-cti.json"
import type { MetricKey } from "./mapa-types"

const normalize = (s: string): string =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, "").trim()

export type CtiMetrics = Record<string, Partial<Record<MetricKey, number>>>

export type CtiEntity = {
  municipio: string
  entidade: string
  categoria: string
  tipo: string
  quantidade: number
  descricao: string
  site: string
  territorio: string
}

export function agregarCtiTerritorios(): CtiMetrics {
  const result: CtiMetrics = {}
  const data = ctiData as {
    counts: Record<string, {
      icts: number
      centrosPesquisa: number
      espacoDinamizadoress: number
      parquesTecnologicos: number
      incubadorasAceleradoras: number
    }>
    entities: CtiEntity[]
  }

  for (const [territoryName, counts] of Object.entries(data.counts)) {
    const key = normalize(territoryName)
    result[key] = {
      icts: counts.icts,
      centrosPesquisa: counts.centrosPesquisa,
      espacoDinamizadoress: counts.espacoDinamizadoress,
      parquesTecnologicos: counts.parquesTecnologicos,
      incubadorasAceleradoras: counts.incubadorasAceleradoras,
    }
  }

  return result
}

export function getCtiEntities(): CtiEntity[] {
  const data = ctiData as { entities: CtiEntity[] }
  return data.entities
}
