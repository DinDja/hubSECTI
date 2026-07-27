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

export type ConectaPonto = {
  projeto?: string
  nome_da_praca?: string
  territorio_identidade?: string
  status_instalacao?: string
  homologacao_prodeb?: string
  instalacao_link_tld?: string
  kit_aldeias_indigenas?: string
  kit_quilombo?: string
  [key: string]: unknown
}

export type ConectaData = Record<string, ConectaPonto[] | undefined>
