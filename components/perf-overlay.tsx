"use client"

import { useEffect, useState } from "react"
import { Cpu, X } from "lucide-react"
import { useLocalLLMMode } from "@/lib/local-llm-context"

export function PerfOverlay() {
  const { useLocal } = useLocalLLMMode()
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  // Reset dismiss quando desliga
  useEffect(() => {
    if (!useLocal) setDismissed(false)
  }, [useLocal])

  useEffect(() => {
    if (useLocal && !dismissed) {
      const t = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(t)
    }
    setVisible(false)
  }, [useLocal, dismissed])

  if (!useLocal || dismissed) return null

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-label="Modo de IA local ativo"
    >
      <div className="relative mx-4 max-w-md border-l-2 border-[#00B5AD] bg-card/95 px-6 py-7 shadow-2xl sm:rounded-md">
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Fechar aviso"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#00B5AD]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00B5AD]" />
          modo otimizado
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#00B5AD]/40 bg-[#00B5AD]/10">
            <Cpu className="h-5 w-5 text-[#00B5AD]" />
          </div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            IA local ativa
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          O site está otimizado para melhor funcionamento da IA local.
          Animações e processamentos pesados foram pausados para liberar
          recursos do dispositivo. Volte ao modo servidor para a experiência
          completa.
        </p>

        <button
          onClick={() => setDismissed(true)}
          className="mt-5 cursor-pointer font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          [ continuar otimizado ]
        </button>
      </div>
    </div>
  )
}
