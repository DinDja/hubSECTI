"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Cpu } from "lucide-react"

type Props = {
  active: boolean
}

export function PerfOverlay({ active }: Props) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (active) {
      const t = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(t)
    }
    setVisible(false)
  }, [active])

  if (!mounted || !active) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-label="Modo de IA local ativo"
    >
      <div className="relative mx-4 max-w-md border-l-2 border-[#00B5AD] bg-card/95 px-6 py-7 shadow-2xl sm:rounded-md">
        <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#00B5AD]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00B5AD] animate-pulse" />
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
          Feche o assistente para retornar à experiência completa.
        </p>
      </div>
    </div>,
    document.body
  )
}
