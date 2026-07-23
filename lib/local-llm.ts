"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type {
  MLCEngine,
  InitProgressReport,
  ChatCompletionMessageParam,
  ChatCompletionChunk,
} from "@mlc-ai/web-llm"

export type LocalLLMStatus =
  | "unset"
  | "loading-engine"
  | "downloading"
  | "loading-model"
  | "ready"
  | "error"

export type LocalLLMState = {
  status: LocalLLMStatus
  progress: number
  isReady: boolean
}

export type { ChatCompletionMessageParam }

export type GenerateToken =
  | { type: "reasoning"; text: string }
  | { type: "content"; text: string }

// Qwen2.5-1.5B - equilibrio entre inteligencia e VRAM (~1.5B params, f32, ~1.9GB)
const MODEL_ID = "Qwen2.5-1.5B-Instruct-q4f32_1-MLC"

// Detecta mobile para nao carregar modelo local (memoria Insuficiente)
function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent || ""
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|CriOS/i.test(ua)
  const isSmallScreen = typeof window !== "undefined" && window.innerWidth < 768
  return isMobileUA || isSmallScreen
}

type EngineRef = {
  engine: MLCEngine | null
  loading: Promise<MLCEngine> | null
}

const engineRef: EngineRef = { engine: null, loading: null }

type ProgressCb = (ratio: number) => void

async function createEngineWithProgress(onProgress: ProgressCb): Promise<MLCEngine> {
  const mod = await import("@mlc-ai/web-llm")
  const { CreateMLCEngine } = mod

  const onInit = (p: InitProgressReport) => {
    const ratio = typeof p.progress === "number" ? p.progress : 0
    onProgress(ratio)
  }

  const engine = await CreateMLCEngine(MODEL_ID, {
    initProgressCallback: onInit,
  })
  try {
    localStorage.setItem("guia-llm-ready", "1")
  } catch {}
  return engine
}

export function useLocalLLM() {
  const [state, setState] = useState<LocalLLMState>(() => ({
    status: "unset",
    progress: 0,
    isReady: false,
  }))
  const autoStartedRef = useRef(false)

  const startDownload = useCallback(async (onProgress?: ProgressCb) => {
    // Guard contra estado inconsistente: isReady mas engine nulo (ex: HMR)
    if (!engineRef.engine && engineRef.loading === null) {
      setState({ status: "loading-engine", progress: 0, isReady: false })
    }
    if (engineRef.engine) {
      setState({ status: "ready", progress: 1, isReady: true })
      return engineRef.engine
    }
    if (engineRef.loading) return engineRef.loading

    setState({ status: "loading-engine", progress: 0, isReady: false })

    engineRef.loading = createEngineWithProgress((ratio) => {
      if (ratio <= 0) {
        setState((s) => ({ ...s, status: "loading-engine" }))
      } else if (ratio < 1) {
        setState({ status: "downloading", progress: ratio, isReady: false })
      } else {
        setState({ status: "loading-model", progress: 1, isReady: false })
      }
      onProgress?.(ratio)
    }).then((engine) => {
      engineRef.engine = engine
      setState({ status: "ready", progress: 1, isReady: true })
      return engine
    }).catch((err) => {
      console.error("WebLLM init falhou:", err)
      setState({ status: "error", progress: 0, isReady: false })
      engineRef.loading = null
      throw err
    }) as Promise<MLCEngine>

    return engineRef.loading
  }, [])

  const generate = useCallback(async function* (
    messages: ChatCompletionMessageParam[],
    opts?: { temperature?: number; max_tokens?: number; signal?: AbortSignal }
  ): AsyncGenerator<GenerateToken, void, unknown> {
    if (!engineRef.engine) {
      throw new Error("Modelo local não está pronto")
    }
    const engine = engineRef.engine
    const stream: AsyncIterable<ChatCompletionChunk> =
      await engine.chat.completions.create({
        stream: true as const,
        messages,
        temperature: opts?.temperature ?? 0.7,
        max_tokens: opts?.max_tokens ?? 512,
      })
    for await (const chunk of stream) {
      if (opts?.signal?.aborted) break
      const reasoning = (chunk.choices?.[0]?.delta as Record<string, unknown>)?.["reasoning_content"] as string | undefined
      if (reasoning) yield { type: "reasoning" as const, text: reasoning }
      const content = chunk.choices?.[0]?.delta?.content
      if (content) yield { type: "content" as const, text: content }
    }
  }, [])

  // Inicia download automaticamente na primeira renderização
  // Pula em mobile (memoria insuficiente - usa servidor)
  useEffect(() => {
    if (autoStartedRef.current) return
    if (isMobileDevice()) return
    autoStartedRef.current = true
    // Sempre reseta estado antes de iniciar (essencial p/ HMR onde engineRef
    // é recriado mas o React state persiste)
    setState({ status: "loading-engine", progress: 0, isReady: false })
    startDownload().catch(() => {})
  }, [startDownload])

  return {
    state,
    startDownload,
    generate,
    isReady: state.status === "ready",
  }
}

export type LocalLLM = ReturnType<typeof useLocalLLM>
