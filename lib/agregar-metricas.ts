import type { MetricKey } from "./mapa-types"

type Projeto = {
  titulo?: string
  status?: string
  territorio?: string[] | string
  [key: string]: unknown
}

const normalize = (s: string): string =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()

const STATUS_CONCLUIDO = new Set(["concluído", "concluido", "finalizado"])
const STATUS_ANDAMENTO = new Set(["em andamento", "andamento", "execução", "execucao", "ativo"])

export type MetricasExternas = Record<string, Partial<Record<MetricKey, number>>>

export function agregarMetricasTerritorios(projetos: Projeto[]): MetricasExternas {
  const map = new Map<string, {
    totalProjetos: number
    projetosConcluidos: number
    projetosAndamento: number
  }>()

  for (const p of projetos) {
    if (!p.titulo) continue
    const territorios = Array.isArray(p.territorio) ? p.territorio : [p.territorio].filter(Boolean)
    if (territorios.length === 0) continue

    const status = (p.status || "").toLowerCase().trim()

    for (const t of territorios) {
      const key = normalize(t)
      if (!key) continue
      if (!map.has(key)) map.set(key, { totalProjetos: 0, projetosConcluidos: 0, projetosAndamento: 0 })
      const entry = map.get(key)!
      entry.totalProjetos++
      if (STATUS_CONCLUIDO.has(status)) entry.projetosConcluidos++
      if (STATUS_ANDAMENTO.has(status)) entry.projetosAndamento++
    }
  }

  const result: MetricasExternas = {}
  for (const [key, val] of map) {
    result[key] = val
  }
  return result
}
