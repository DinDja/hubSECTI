"use client"

import { Download, Check, AlertCircle } from "lucide-react"
import type { LocalLLMState } from "@/lib/local-llm"

type Props = {
  state: LocalLLMState
  onStart: () => void
  className?: string
}

const RADIUS = 11
const CIRC = 2 * Math.PI * RADIUS

export function DownloadModelButton({ state, onStart, className }: Props) {
  const { status, progress } = state
  const isBusy =
    status === "loading-engine" ||
    status === "downloading" ||
    status === "loading-model"

  const dashOffset = CIRC * (1 - (isBusy ? progress : status === "ready" ? 1 : 0))
  const labelMap: Record<string, string> = {
    "loading-engine": "iniciando…",
    "downloading": `${Math.round(progress * 100)}%`,
    "loading-model": "carregando…",
    "ready": "IA local pronta",
    "error": "erro ao baixar",
    "unset": "baixar IA local",
  }

  const Icon = status === "error" ? AlertCircle : status === "ready" ? Check : Download

  return (
    <button
      onClick={() => {
        if (status === "unset" || status === "error") onStart()
      }}
      disabled={isBusy || status === "ready"}
      aria-label={`Modelo local: ${labelMap[status] ?? status}`}
      title={labelMap[status]}
      className={`group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-all disabled:cursor-default ${
        status === "error"
          ? "border-red-500/60 bg-red-500/10 text-red-500"
          : status === "ready"
            ? "border-[#00B5AD] bg-[#00B5AD]/10 text-[#00B5AD]"
            : "border-border bg-background text-muted-foreground hover:border-[#00B5AD]/40 hover:text-foreground"
      } ${className ?? ""}`}
    >
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <circle
          cx="12" cy="12" r={RADIUS}
          className="stroke-current opacity-15"
          strokeWidth="1.5"
        />
        {(isBusy || status === "ready") && (
          <circle
            cx="12" cy="12" r={RADIUS}
            className={`stroke-[#00B5AD]`}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 200ms ease-out" }}
          />
        )}
        {status === "downloading" && (
          <circle cx="12" cy="12" r={RADIUS + 1.5}
            className="stroke-[#00B5AD]/20 animate-ping"
            strokeWidth="1" fill="none"
          />
        )}
      </svg>
      <Icon className="relative h-4 w-4" />
    </button>
  )
}
