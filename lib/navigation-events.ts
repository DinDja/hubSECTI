export const NAV_EVENTS = {
  FOCUS_PROJETO: "nav:focus-projeto",
  FOCUS_SISTEMA: "nav:focus-sistema",
  FOCUS_MAPA_MUNICIPIO: "nav:focus-mapa-municipio",
  OPEN_KNOWLEDGE: "nav:open-knowledge",
} as const

export function dispatchFocusProjeto(projetoId: string) {
  window.dispatchEvent(new CustomEvent(NAV_EVENTS.FOCUS_PROJETO, { detail: { projetoId } }))
}

export function dispatchFocusSistema(systemTitle: string) {
  window.dispatchEvent(new CustomEvent(NAV_EVENTS.FOCUS_SISTEMA, { detail: { systemTitle } }))
}

export function dispatchFocusMapaMunicipio(municipioNome: string) {
  window.dispatchEvent(new CustomEvent(NAV_EVENTS.FOCUS_MAPA_MUNICIPIO, { detail: { municipioNome } }))
}

export function dispatchOpenKnowledge(entryId: string) {
  window.dispatchEvent(new CustomEvent(NAV_EVENTS.OPEN_KNOWLEDGE, { detail: { entryId } }))
}
