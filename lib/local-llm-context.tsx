"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

export type ModelChoice =
  | "server"
  | "Qwen2.5-0.5B-Instruct-q4f32_1-MLC"
  | "Qwen2.5-1.5B-Instruct-q4f32_1-MLC"
  | "Qwen3.5-0.8B-q4f32_1-MLC"
  | "Qwen3-0.6B-q4f32_1-MLC"
  | "Qwen3-1.7B-q4f32_1-MLC"
  | "Llama-3.2-3B-Instruct-q4f32_1-MLC"
  | "gemma-2-2b-it-q4f32_1-MLC"

const VALID_LOCAL_MODELS: ModelChoice[] = [
  "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
  "Qwen2.5-1.5B-Instruct-q4f32_1-MLC",
  "Qwen3.5-0.8B-q4f32_1-MLC",
  "Qwen3-0.6B-q4f32_1-MLC",
  "Qwen3-1.7B-q4f32_1-MLC",
  "Llama-3.2-3B-Instruct-q4f32_1-MLC",
  "gemma-2-2b-it-q4f32_1-MLC",
]

export type ModelOption = {
  value: ModelChoice
  label: string
  group: string
  logoPath?: string
}

export const MODEL_OPTIONS: ModelOption[] = [
  { value: "server", label: "Servidor (z-ai GLM-4.5)", group: "Servidor", logoPath: "/img/zhipu.svg" },
  { value: "Qwen2.5-0.5B-Instruct-q4f32_1-MLC", label: "Qwen 2.5 0.5B", group: "Qwen — Leve", logoPath: "/img/qwen.svg" },
  { value: "Qwen2.5-1.5B-Instruct-q4f32_1-MLC", label: "Qwen 2.5 1.5B", group: "Qwen — Leve", logoPath: "/img/qwen.svg" },
  { value: "Qwen3-0.6B-q4f32_1-MLC", label: "Qwen 3 0.6B", group: "Qwen — Leve", logoPath: "/img/qwen.svg" },
  { value: "Qwen3.5-0.8B-q4f32_1-MLC", label: "Qwen 3.5 0.8B", group: "Qwen — Leve", logoPath: "/img/qwen.svg" },
  { value: "Qwen3-1.7B-q4f32_1-MLC", label: "Qwen 3 1.7B", group: "Qwen — Médio", logoPath: "/img/qwen.svg" },
  { value: "Llama-3.2-3B-Instruct-q4f32_1-MLC", label: "Llama 3.2 3B", group: "Llama — Médio", logoPath: "/img/meta.svg" },
  { value: "gemma-2-2b-it-q4f32_1-MLC", label: "Gemma 2 2B", group: "Google — Médio", logoPath: "/img/google.svg" },
]

const DEFAULT_LOCAL: ModelChoice = "Qwen2.5-1.5B-Instruct-q4f32_1-MLC"

export function isThinkingCapableModel(modelId: string): boolean {
  return /Qwen3|Qwen3\.5|DeepSeek-R1/.test(modelId)
}

type Ctx = {
  modelChoice: ModelChoice
  useLocal: boolean
  activeModelId: string | null
  setModelChoice: (choice: ModelChoice) => void
  thinkingEnabled: boolean
  setThinkingEnabled: (v: boolean) => void
}

const LocalLLMContext = createContext<Ctx | null>(null)

const STORAGE_KEY = "guia-model-choice"
const THINKING_STORAGE_KEY = "guia-thinking-enabled"

export function LocalLLMProvider({ children }: { children: ReactNode }) {
  const [modelChoice, setModelChoiceState] = useState<ModelChoice>("server")
  const [thinkingEnabled, setThinkingEnabledState] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "server" || VALID_LOCAL_MODELS.includes(saved as ModelChoice)) {
      setModelChoiceState(saved as ModelChoice)
    } else if (saved === "local") {
      setModelChoiceState(DEFAULT_LOCAL)
    }

    const thinkingSaved = localStorage.getItem(THINKING_STORAGE_KEY)
    if (thinkingSaved === "1") setThinkingEnabledState(true)
  }, [])

  const setModelChoice = useCallback((choice: ModelChoice) => {
    setModelChoiceState(choice)
    try { localStorage.setItem(STORAGE_KEY, choice) } catch {}
  }, [])

  const setThinkingEnabled = useCallback((v: boolean) => {
    setThinkingEnabledState(v)
    try { localStorage.setItem(THINKING_STORAGE_KEY, v ? "1" : "0") } catch {}
  }, [])

  const useLocal = modelChoice !== "server"
  const activeModelId = useLocal ? modelChoice : null

  return (
    <LocalLLMContext.Provider value={{ modelChoice, useLocal, activeModelId, setModelChoice, thinkingEnabled, setThinkingEnabled }}>
      {children}
    </LocalLLMContext.Provider>
  )
}

export function useLocalLLMMode(): Ctx {
  const ctx = useContext(LocalLLMContext)
  if (!ctx) {
    if (typeof window === "undefined") {
      return { modelChoice: "server", useLocal: false, activeModelId: null, setModelChoice: () => {}, thinkingEnabled: false, setThinkingEnabled: () => {} }
    }
    throw new Error("useLocalLLMMode deve ser usado dentro de LocalLLMProvider")
  }
  return ctx
}
