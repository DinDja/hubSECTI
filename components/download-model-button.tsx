"use client"

import { Sparkles, Check, AlertCircle } from "lucide-react"
import type { LocalLLMState } from "@/lib/local-llm"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

type Props = {
  state: LocalLLMState
  onStart: () => void
  className?: string
}

const RADIUS = 11
const WAVE = "M0,1 C6,6 12,-4 18,1 C24,6 30,-4 36,1 L36,24 L0,24 Z"
const WAVE_2 = "M0,3 C6,-2 12,7 18,3 C24,-2 30,7 36,3 L36,24 L0,24 Z"

export function DownloadModelButton({ state, onStart, className }: Props) {
  const { status, progress } = state
  const isBusy =
    status === "loading-engine" ||
    status === "downloading" ||
    status === "loading-cache" ||
    status === "loading-model"

  const fillLevel = isBusy ? progress : status === "ready" ? 1 : 0
  const liquidY = 23 - fillLevel * 22

  const labelMap: Record<string, string> = {
    "loading-engine": "iniciando…",
    "loading-cache": "verificando…",
    "downloading": `${Math.round(progress * 100)}%`,
    "loading-model": "carregando…",
    "ready": "pronto",
    "error": "erro",
    "unset": "ativar assistente",
  }

  const Icon = status === "error" ? AlertCircle : status === "ready" ? Check : status === "unset" ? Sparkles : null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => {
            if (status === "unset" || status === "error") onStart()
          }}
          disabled={isBusy || status === "ready"}
          aria-label={`Modelo local: ${labelMap[status] ?? status}`}
          className={`group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-all disabled:cursor-default ${
            status === "error"
              ? "border-red-500/60 bg-red-500/10 text-red-500"
              : status === "ready"
                ? "border-[#00B5AD] bg-[#00B5AD]/10 text-[#00B5AD]"
                : "border-border bg-background text-muted-foreground hover:border-[#00B5AD]/40 hover:text-foreground"
          } ${className ?? ""}`}
        >
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00B5AD" />
                <stop offset="100%" stopColor="#0077C0" />
              </linearGradient>
              <clipPath id="circleClip">
                <circle cx="12" cy="12" r={RADIUS} />
              </clipPath>
            </defs>

            <circle
              cx="12" cy="12" r={RADIUS}
              className="stroke-current opacity-15"
              strokeWidth="1.5"
            />

            {(isBusy || status === "ready") && (
              <g clipPath="url(#circleClip)">
                <g style={{ transform: `translateY(${liquidY}px)`, transition: "transform 350ms ease-out" }}>
                  <rect x="0" y="0" width="24" height="24" fill="url(#liquidGrad)" />
                  <g className="animate-liquid-tremble-1">
                    <path d={WAVE} fill="url(#liquidGrad)" opacity="0.5" />
                  </g>
                  <g className="animate-liquid-tremble-2">
                    <path d={WAVE_2} fill="url(#liquidGrad)" opacity="0.3" />
                  </g>
                </g>
              </g>
            )}

            {status === "downloading" && (
              <circle cx="12" cy="12" r={RADIUS + 1.5}
                className="stroke-[#00B5AD]/20 animate-ping"
                strokeWidth="1" fill="none"
              />
            )}
          </svg>

          {Icon && (
            <Icon className={`relative h-4 w-4 ${status === "ready" ? "text-[#00B5AD]" : ""}`} />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{labelMap[status]}</TooltipContent>
    </Tooltip>
  )
}
