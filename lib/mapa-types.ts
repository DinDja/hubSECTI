export type MetricKey =
  | "totalProjetos"
  | "projetosConcluidos"
  | "projetosAndamento"
  | "municipiosConectados"
  | "totalMunicipios"
  | "installedPoints"

export type MunicipioRender = {
  nome: string
  geocodigo: string
  d: string
  territorioId: number
  cor: string
}

export type TerritorioInfo = {
  id: number
  nome: string
  municipios: string[]
  metricas: Record<MetricKey, number>
}
