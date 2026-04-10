import territoriosMunicipios from "@/lib/territorioMunicipios.json"

export type ConectaPoint = {
  status_instalacao?: unknown
}

const MUNICIPIO_ALIASES: Record<string, string> = {
  camacan: "camaca",
  "muquem do sao francisco": "muquem de sao francisco",
}

function normalizeConectaText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
}

export function simplifyMunicipioName(value: unknown) {
  const base = normalizeConectaText(value).replace(/\s*[\-–].*$/g, "").trim()
  return MUNICIPIO_ALIASES[base] || base
}

export function isInstalledStatus(value: unknown) {
  return String(value || "").trim().toLowerCase() === "instalado"
}

const MUNICIPIO_TERRITORIO_MAP = (() => {
  const map = new Map<string, string>()

  territoriosMunicipios.territorios_de_identidade.forEach((territorio) => {
    territorio.municipios.forEach((municipio) => {
      map.set(simplifyMunicipioName(municipio), String(territorio.nome || ""))
    })
  })

  return map
})()

export type ConectaCoverage = {
  municipalitiesCount: number
  territoriesCount: number
  installedPointsCount: number
  municipalitiesSet: Set<string>
  territoriesSet: Set<string>
}

export function computeConectaCoverage(conectaData: Record<string, unknown[] | undefined>): ConectaCoverage {
  const municipalitiesSet = new Set<string>()
  const territoriesSet = new Set<string>()
  let installedPointsCount = 0

  Object.entries(conectaData || {}).forEach(([municipio, pracas]) => {
    const rows = Array.isArray(pracas) ? (pracas as ConectaPoint[]) : []
    const installedRows = rows.filter((row) => isInstalledStatus(row?.status_instalacao))

    if (installedRows.length === 0) return

    const normalizedMunicipio = simplifyMunicipioName(municipio)
    if (!normalizedMunicipio) return

    municipalitiesSet.add(normalizedMunicipio)
    installedPointsCount += installedRows.length

    const territorio = MUNICIPIO_TERRITORIO_MAP.get(normalizedMunicipio)
    if (territorio) {
      territoriesSet.add(territorio)
    }
  })

  return {
    municipalitiesCount: municipalitiesSet.size,
    territoriesCount: territoriesSet.size,
    installedPointsCount,
    municipalitiesSet,
    territoriesSet,
  }
}
