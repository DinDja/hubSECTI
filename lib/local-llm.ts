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

// Qwen3-0.6B - modelo leve para PC fraco (~0.6B params, 4-bit f32, ~1.9GB VRAM)
const MODEL_ID = "Qwen3-0.6B-q4f32_1-MLC"

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
  ): AsyncGenerator<string, void, unknown> {
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
        extra_body: { enable_thinking: false },
      })
    for await (const chunk of stream) {
      if (opts?.signal?.aborted) break
      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) yield delta
    }
  }, [])

  // Inicia download automaticamente na primeira renderização
  useEffect(() => {
    if (autoStartedRef.current) return
    autoStartedRef.current = true
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
