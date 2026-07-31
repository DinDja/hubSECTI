"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type {
  MLCEngine,
  InitProgressReport,
  ChatCompletionMessageParam,
  ChatCompletionChunk,
  AppConfig,
} from "@mlc-ai/web-llm"

export type LocalLLMStatus =
  | "unset"
  | "loading-engine"
  | "downloading"
  | "loading-cache"
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
  modelId: string | null
}

const engineRef: EngineRef = { engine: null, loading: null, modelId: null }

type ProgressCb = (ratio: number) => void

async function createEngineWithProgress(modelId: string, onProgress: ProgressCb): Promise<MLCEngine> {
  const mod = await import("@mlc-ai/web-llm")
  const { CreateMLCEngine, prebuiltAppConfig } = mod

  const onInit = (p: InitProgressReport) => {
    const ratio = typeof p.progress === "number" ? p.progress : 0
    onProgress(ratio)
  }

  // sliding_window_size: -1 desativa sliding window (evita conflito com context_window_size)
  const overrides: Record<string, unknown> = { sliding_window_size: -1 }
  // indexeddb em vez de cache API (padrão) para evitar Cache.add() com falha de rede
  const appConfig: AppConfig = { ...prebuiltAppConfig, cacheBackend: "indexeddb" }

  const engine = await CreateMLCEngine(modelId, {
    initProgressCallback: onInit,
    appConfig,
  }, overrides)
  return engine
}

export function useLocalLLM(modelId?: string | null) {
  const currentModelId = modelId || "Qwen2.5-1.5B-Instruct-q4f32_1-MLC"

  const [state, setState] = useState<LocalLLMState>(() => {
    if (engineRef.engine && engineRef.modelId === currentModelId) {
      return { status: "ready", progress: 1, isReady: true }
    }
    return { status: "unset", progress: 0, isReady: false }
  })
  const autoStartedRef = useRef(false)

  const startDownload = useCallback(async (targetModelId: string = currentModelId, onProgress?: ProgressCb) => {
    if (engineRef.engine && engineRef.modelId === targetModelId) {
      setState({ status: "ready", progress: 1, isReady: true })
      return engineRef.engine
    }
    if (engineRef.loading && engineRef.modelId === targetModelId) {
      return engineRef.loading
    }

    if (engineRef.engine && engineRef.modelId !== targetModelId) {
      try {
        await engineRef.engine.unload()
      } catch {}
      engineRef.engine = null
      engineRef.loading = null
    }

    engineRef.modelId = targetModelId
    setState({ status: "loading-engine", progress: 0, isReady: false })

    let cached = false
    try { cached = localStorage.getItem(`guia-llm-ready-${targetModelId}`) === "1" } catch {}
    const initState = cached ? "loading-cache" : "loading-engine"

    engineRef.loading = createEngineWithProgress(targetModelId, (ratio) => {
      if (ratio <= 0) {
        setState((s) => ({ ...s, status: initState }))
      } else if (ratio < 1) {
        setState({ status: cached ? "loading-cache" : "downloading", progress: ratio, isReady: false })
      } else {
        setState({ status: "loading-model", progress: 1, isReady: false })
      }
      onProgress?.(ratio)
    }).then((engine) => {
      engineRef.engine = engine
      engineRef.modelId = targetModelId
      setState({ status: "ready", progress: 1, isReady: true })
      try { localStorage.setItem(`guia-llm-ready-${targetModelId}`, "1") } catch {}
      return engine
    }).catch((err) => {
      console.error("WebLLM init falhou:", err)
      setState({ status: "error", progress: 0, isReady: false })
      engineRef.loading = null
      engineRef.modelId = null
      throw err
    }) as Promise<MLCEngine>

    return engineRef.loading
  }, [currentModelId])

  useEffect(() => {
    if (engineRef.engine && engineRef.modelId === currentModelId) {
      setState({ status: "ready", progress: 1, isReady: true })
    } else if (engineRef.loading && engineRef.modelId === currentModelId) {
      // Keep loading state if in progress
    } else {
      setState({ status: "unset", progress: 0, isReady: false })
    }
  }, [currentModelId])

  // Auto-carrega o modelo quando o usuário troca (sem precisar clicar no botão)
  // Pula se: já está pronto, já está carregando, mobile, ou servidor (modelId null = server)
  const loadedForRef = useRef<string | null>(null)
  useEffect(() => {
    if (!modelId) return
    if (engineRef.engine && engineRef.modelId === currentModelId) return
    if (engineRef.loading && engineRef.modelId === currentModelId) return
    if (loadedForRef.current === currentModelId && engineRef.engine === null) return
    loadedForRef.current = currentModelId
    setState({ status: "loading-engine", progress: 0, isReady: false })
    startDownload(currentModelId).catch(() => {})
  }, [currentModelId, modelId, startDownload])

  const generate = useCallback(async function* (
    messages: ChatCompletionMessageParam[],
    opts?: { temperature?: number; max_tokens?: number; signal?: AbortSignal; enable_thinking?: boolean }
  ): AsyncGenerator<GenerateToken, void, unknown> {
    if (!engineRef.engine) {
      throw new Error("Modelo local não está pronto")
    }
    const engine = engineRef.engine
    const isThinkingModel = engineRef.modelId ? /Qwen3|Qwen3\.5|DeepSeek-R1/.test(engineRef.modelId) : false
    const request: Record<string, unknown> = {
      stream: true,
      messages,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.max_tokens ?? 512,
    }
    if (isThinkingModel) {
      if (opts?.enable_thinking === false) {
        request.extra_body = { enable_thinking: false }
      }
    }

    const stream = await engine.chat.completions.create(request as unknown as Parameters<typeof engine.chat.completions.create>[0]) as AsyncIterable<ChatCompletionChunk>
    for await (const chunk of stream) {
      if (opts?.signal?.aborted) break
      const delta = chunk.choices?.[0]?.delta
      const reasoning = (delta as Record<string, unknown>)?.reasoning_content as string | undefined
      if (reasoning) yield { type: "reasoning" as const, text: reasoning }
      const content = delta?.content
      if (content) yield { type: "content" as const, text: content }
    }
  }, [])

  useEffect(() => {
    if (autoStartedRef.current) return
    if (isMobileDevice()) return
    autoStartedRef.current = true
    const timer = setTimeout(() => {
      if (modelId && currentModelId === "Qwen2.5-1.5B-Instruct-q4f32_1-MLC") {
        setState({ status: "loading-engine", progress: 0, isReady: false })
        startDownload(currentModelId).catch(() => {})
      }
    }, 7_000)
    return () => clearTimeout(timer)
  }, [startDownload, currentModelId, modelId])

  return {
    state,
    startDownload,
    generate,
    isReady: state.status === "ready" && engineRef.modelId === currentModelId,
  }
}

export type LocalLLM = ReturnType<typeof useLocalLLM>
