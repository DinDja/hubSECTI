"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

type Mode = "local" | "server"

type Ctx = {
  mode: Mode
  useLocal: boolean
  setMode: (m: Mode) => void
  toggle: () => void
}

const LocalLLMContext = createContext<Ctx | null>(null)

const STORAGE_KEY = "guia-model-pref"

export function LocalLLMProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>(() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === "local" || saved === "server") return saved
    }
    return "server"
  })

  const setMode = useCallback((m: Mode) => {
    setModeState(m)
    try { localStorage.setItem(STORAGE_KEY, m) } catch {}
  }, [])

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "local" ? "server" : "local"
      try { localStorage.setItem(STORAGE_KEY, next) } catch {}
      return next
    })
  }, [])

  // useLocal efetivo: só ativo se preferido "local".
  // O chatbot valida se o engine está pronto antes de usar; aqui só emitimos preferência.
  const useLocal = mode === "local"

  return (
    <LocalLLMContext.Provider value={{ mode, useLocal, setMode, toggle }}>
      {children}
    </LocalLLMContext.Provider>
  )
}

export function useLocalLLMMode(): Ctx {
  const ctx = useContext(LocalLLMContext)
  if (!ctx) throw new Error("useLocalLLMMode deve ser usado dentro de LocalLLMProvider")
  return ctx
}
