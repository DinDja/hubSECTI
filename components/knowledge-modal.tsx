"use client"

import { useEffect, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { X, ExternalLink, Lightbulb, ArrowUpRight } from "lucide-react"
import { allEntries, type KnowledgeEntry } from "@/lib/chatbot-knowledge"
import { NAV_EVENTS } from "@/lib/navigation-events"

export function KnowledgeModal() {
  const [entry, setEntry] = useState<KnowledgeEntry | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const close = useCallback(() => setEntry(null), [])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { entryId: string }
      if (!detail?.entryId) return
      const found = allEntries.find((x) => x.id === detail.entryId)
      if (found) setEntry(found)
    }
    window.addEventListener(NAV_EVENTS.OPEN_KNOWLEDGE, handler)
    return () => window.removeEventListener(NAV_EVENTS.OPEN_KNOWLEDGE, handler)
  }, [])

  useEffect(() => {
    if (!entry) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [entry, close])

  if (!mounted || !entry) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={close}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600">
              <Lightbulb size={16} />
            </span>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Conhecimento</p>
              <p className="text-xs text-muted-foreground capitalize">{entry.category}</p>
            </div>
          </div>
          <button onClick={close} className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <h3 className="text-lg font-bold text-foreground leading-snug">{entry.title}</h3>
          </div>

          <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
            {entry.content}
          </div>

          {entry.keywords.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Palavras-chave</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.keywords.map((kw) => (
                  <span key={kw} className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600 font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {entry.links && entry.links.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Links</p>
              <div className="space-y-2">
                {entry.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full rounded-xl border border-border bg-card/50 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors group"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
