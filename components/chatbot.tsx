"use client"

import { useState, useRef, useEffect } from "react"
import { X, ArrowUp, MessageSquare } from "lucide-react"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { getAllChatSnapshots } from "@/lib/chat-store"

type QuickQuestion = { label: string; query: string; color: string }

const QUICK_QUESTIONS: QuickQuestion[] = [
  { label: "Sistemas", query: "Quais sistemas estão disponíveis?", color: "#00B5AD" },
  { label: "Projetos", query: "Quantos projetos existem?", color: "#0077C0" },
  { label: "Conecta Bahia", query: "Dados do Conecta Bahia", color: "#7AC143" },
  { label: "SECTI", query: "O que é a SECTI?", color: "#F7941D" },
  { label: "Territórios", query: "Quantos territórios tem a Bahia?", color: "#EC008C" },
  { label: "Notícias", query: "Últimas notícias", color: "#ED1C24" },
]

const INITIAL_MESSAGES: UIMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    parts: [{ type: "text", text: "Sou o GUIÁ, assistente do Hub SECTI. Consulto sistemas, projetos (ao vivo), Conecta Bahia, territórios e mais.\n\nComo posso ajudar?" }],
  },
]

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function renderRichText(text: string): string {
  const tokens: string[] = []
  const pattern = /(\*\*(.+?)\*\*)|(\[(.+?)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s<]+)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) tokens.push(escapeHtml(text.slice(last, m.index)))
    if (m[1]) {
      tokens.push(`<strong>${escapeHtml(m[2])}</strong>`)
    } else if (m[3]) {
      const label = escapeHtml(m[4])
      const url = escapeHtml(m[5])
      tokens.push(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[#0077C0] underline underline-offset-2 hover:text-[#00B5AD] transition-colors">${label}</a>`)
    } else if (m[6]) {
      const url = escapeHtml(m[6])
      tokens.push(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[#0077C0] underline underline-offset-2 hover:text-[#00B5AD] transition-colors">${url}</a>`)
    }
    last = pattern.lastIndex
  }
  if (last < text.length) tokens.push(escapeHtml(text.slice(last)))
  return tokens.join("")
}

function getMessageText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

function MsgCounter({ n }: { n: number }) {
  return <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{String(n).padStart(2, "0")}</span>
}

export function Chatbot() {
  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    messages: INITIAL_MESSAGES,
  })
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isTyping = status === "submitted" || status === "streaming"
  const msgCount = messages.filter((m) => m.role === "assistant").length

  useEffect(() => {
    if (!isOpen) return
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping, isOpen])

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  const handleSend = async (query: string) => {
    const text = query.trim()
    if (!text || isTyping) return
    setInput("")
    const snapshots = await getAllChatSnapshots()
    const context = snapshots.map((s) => `[Fonte: ${s.source}]\n${s.content}`).join("\n\n")
    await sendMessage({ text }, context ? { body: { context } } : undefined)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  return (
    <>
      {/* Trigger — bloco quadrado catalog-style, nao bubble de IA */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`cursor-pointer group fixed bottom-6 right-6 z-50 flex items-center gap-3 border border-border bg-card px-4 py-2.5 shadow-sm transition-all duration-300 hover:border-[#00B5AD]/40 hover:bg-muted ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        aria-label="Abrir assistente GUIÁ"
      >
        <img src="/img/GUIA.svg" alt="GUIÁ" className="h-5 w-5" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
          GUIÁ
        </span>
      </button>

      {/* Panel */}
      <div
        className={`fixed z-50 flex flex-col overflow-hidden border border-border bg-card transition-all duration-300 ${
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        } bottom-6 right-6 max-sm:bottom-0 max-sm:right-0 max-sm:border-x-0 max-sm:border-b-0 sm:w-[400px]`}
        style={{ height: "min(620px, calc(100vh - 120px))" }}
      >
        {/* Header — catalog tag bar como nos cards */}
        <header className="flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background">
              <img src="/img/GUIA.svg" alt="GUIÁ" className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <span style={{ color: "#00B5AD" }}>●</span>{" "}
                Assistente
              </span>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">GUIÁ</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MsgCounter n={msgCount - 1} />
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted"
              aria-label="Fechar chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Status line em catálogo, como nos cards */}
        {isTyping && (
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00B5AD]" />
            consultando base…
          </div>
        )}

        {/* Messages — cartoes com border-left, sem bubbles */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-4">
            {messages.map((msg, i) => {
              const text = getMessageText(msg)
              if (!text && msg.role === "assistant" && status !== "streaming") return null
              return (
                <div
                  key={msg.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
                >
                  {msg.role === "user" ? (
                    /* Mensagem do usuario — right-aligned, underline catalog style */
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        você
                      </span>
                      <span className="border-b border-[#0077C0]/60 pb-0.5 text-sm leading-relaxed text-foreground">
                        {text}
                      </span>
                    </div>
                  ) : (
                    /* Resposta do assistente — catalog card com border-left color */
                    <div
                      className="border-l-2 border-[#00B5AD] pl-4"
                      style={{ borderColor: msg.id === "welcome" ? "#00B5AD" : "#0077C0" }}
                    >
                      <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        <span style={{ color: msg.id === "welcome" ? "#00B5AD" : "#0077C0" }}>●</span>
                        <span>GUIÁ</span>
                        <MsgCounter n={i} />
                      </div>
                      <div
                        className="text-sm leading-relaxed text-foreground whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: renderRichText(text) }}
                      />
                    </div>
                  )}
                </div>
              )
            })}

            {isTyping && (
              <div className="border-l-2 border-muted pl-4">
                <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00B5AD]" />
                  GUIÁ · processando…
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2].map((j) => (
                    <span
                      key={j}
                      className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/40"
                      style={{ animationDelay: `${j * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="border-l-2 border-red-500 pl-4">
                <div className="text-sm text-red-500">
                  Erro ao conectar. Tente novamente.
                </div>
                <button
                  onClick={() => setMessages(messages.filter((m) => m.role === "assistant").slice(0, 1))}
                  className="mt-2 cursor-pointer font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  Reiniciar conversa
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick questions — catalog tags com color dots */}
        {messages.length <= 1 && !isTyping && (
          <div className="border-t border-border px-5 py-3">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              tópicos sugeridos
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q.query}
                  onClick={() => handleSend(q.query)}
                  className="cursor-pointer flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="h-1.5 w-1.5" style={{ backgroundColor: q.color }} />
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input — underline search style como nos filtros do site */}
        <div className="border-t border-border px-5 py-4">
          <div className="relative flex items-center">
            <MessageSquare className="absolute left-0 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="pergunte ao GUIÁ…"
              className="w-full border-b border-border bg-transparent py-1.5 pl-6 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground"
            />
            {isTyping ? (
              <button
                onClick={() => stop()}
                className="absolute right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground transition-all hover:border-red-500/40 hover:text-red-500"
                aria-label="Parar"
              >
                <span className="h-3 w-3 bg-current" />
              </button>
            ) : (
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isTyping}
                className="absolute right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground transition-all hover:border-[#0077C0]/40 hover:text-[#0077C0] disabled:opacity-40"
                aria-label="Enviar"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}