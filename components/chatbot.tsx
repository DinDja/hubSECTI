"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { X, ArrowUp, MessageSquare } from "lucide-react"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { getAllChatSnapshots } from "@/lib/chat-store"
import { useLocalLLM, type ChatCompletionMessageParam, type GenerateToken } from "@/lib/local-llm"
import { DownloadModelButton } from "@/components/download-model-button"
import { allEntries } from "@/lib/chatbot-knowledge"

// Prompt compacto para o modelo local (SmolLM2-135M tem contexto limitado)
function buildLocalSystemPrompt(context?: string): string {
  const brief = allEntries
    .map((e) => `- ${e.title}: ${e.content.split("\n")[0]}`)
    .join("\n")
  const live = context ? `\n\nContexto ao vivo:\n${context.slice(0, 600)}` : ""
  return `Voce e o GUIA, assistente do Hub SECTI (ciencia, tecnologia e inovacao da Bahia). Responda em portugues, curto e direto.\nSistemas conhecidos:\n${brief.slice(0, 1200)}${live}`
}

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

// Separa pensamento (delimitado por || ) da resposta e renderiza com estilo
function renderWithThinking(text: string): string {
  const idx = text.indexOf("||")
  if (idx === -1) return renderRichText(text.trim())
  const thinking = text.slice(0, idx).trim()
  const response = text.slice(idx + 2).trim()
  if (!thinking) return renderRichText(response)
  return `<div class="mb-3 rounded-md border border-[#00B5AD]/20 bg-[#00B5AD]/5 px-3 py-2 font-mono text-xs leading-relaxed text-muted-foreground">`
    + `<span class="mb-1 block text-[10px] uppercase tracking-wider text-[#00B5AD]/60">pensamento</span>`
    + `${escapeHtml(thinking)}</div>`
    + renderRichText(response)
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
  const localLLM = useLocalLLM()

  const useChatInstance = useChat({
    messages: INITIAL_MESSAGES,
  })
  const { messages, sendMessage, status, stop, error, setMessages } = useChatInstance
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [localRunning, setLocalRunning] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const isTyping = (status === "submitted" || status === "streaming") || localRunning
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

  const handleSend = useCallback(async (query: string) => {
    const text = query.trim()
    if (!text || isTyping) return
    setInput("")

    // snapshot da base para contexto (usado por ambos os caminhos)
    const snapshots = await getAllChatSnapshots()
    const context = snapshots
      .map((s) => `[Fonte: ${s.source}]\n${s.content}`)
      .join("\n\n")

    // --- Caminho LOCAL: modelo local pronto, gerar no cliente ---
    if (localLLM.isReady) {
      const prevMessages = messages
      const userMsgId = `u-${Date.now()}`
      setMessages([
        ...prevMessages,
        { id: userMsgId, role: "user", parts: [{ type: "text" as const, text }] },
      ])

      const systemPrompt = buildLocalSystemPrompt(context)
      const conv: ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ]

      const assistantMsgId = `a-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", parts: [{ type: "text" as const, text: "" }] },
      ])

      const controller = new AbortController()
      abortRef.current = controller
      setLocalRunning(true)

      try {
        let reasoningAcc = ""
        let contentAcc = ""
        for await (const token of localLLM.generate(conv, {
          temperature: 0.7,
          max_tokens: 512,
          signal: controller.signal,
        })) {
          if (token.type === "reasoning") {
            reasoningAcc += token.text
          } else {
            contentAcc += token.text
          }
          const displayText = reasoningAcc
            ? `||${reasoningAcc}\n\n${contentAcc}`
            : contentAcc
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, parts: [{ type: "text" as const, text: displayText }] }
                : m
            )
          )
        }
        if (reasoningAcc || contentAcc) return // sucesso, sai

        // acc vazio → fallback silencioso
        console.warn("Local LLM: resposta vazia, fallback para servidor")
      } catch (err) {
        console.warn("Local LLM: erro, fallback para servidor", err)
      } finally {
        setLocalRunning(false)
        abortRef.current = null
      }

      // fallback: remove msg local e chama servidor
      setMessages(prevMessages)
      await sendMessage(
        { text },
        context ? { body: { context } } : undefined
      )
      return
    }

    // --- Caminho SERVIDOR: z-ai (GLM-4.5-flash) ---
    await sendMessage(
      { text },
      context ? { body: { context } } : undefined
    )
  }, [isTyping, localLLM, localLLM.isReady, messages, sendMessage, setMessages])

  const handleStop = useCallback(() => {
    if (localRunning) {
      abortRef.current?.abort()
      setLocalRunning(false)
    } else {
      stop()
    }
  }, [localRunning, stop])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  return (
    <>
      {/* Trigger — quadrado catalog-style como nos cards do site */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`cursor-pointer group fixed bottom-6 right-6 z-50 flex items-center gap-3 border border-border bg-card px-4 py-2.5 shadow-sm transition-all duration-300 hover:border-[#00B5AD]/40 hover:bg-muted ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        aria-label="Abrir assistente GUIÁ"
      >
        <div className="relative">
          <img src="/img/GUIA.svg" alt="GUIÁ" className="h-5 w-5" />
          {/* Dot indicador: verde quando local, cinza quando servidor */}
          <span className={`absolute -top-1 -right-1 h-2 w-2 rounded-full border-2 border-card ${
            localLLM.isReady ? "bg-[#00B5AD]" : "bg-muted-foreground/40"
          }`} />
        </div>
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
          GUIÁ
        </span>
      </button>

      {/* Panel */}
      <div
        className={`fixed z-50 flex flex-col overflow-hidden border border-border bg-card transition-all duration-300 ${
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        } bottom-6 right-6 max-sm:bottom-0 max-sm:right-0 max-sm:border-x-0 max-sm:border-b-0 sm:w-[400px] sm:rounded-xl`}
        style={{ height: "min(620px, calc(100vh - 120px))" }}
      >
        {/* Header — catalog tag bar com linha de cor no topo */}
        <header className="relative flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#00B5AD] via-[#0077C0] to-[#7AC143]" />
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background">
              <img src="/img/GUIA.svg" alt="GUIÁ" className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${localLLM.isReady ? "bg-[#00B5AD]" : "bg-muted-foreground/40"}`} />
                {localLLM.isReady ? "IA local" : "Servidor"}
              </span>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">GUIÁ</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DownloadModelButton
              state={localLLM.state}
              onStart={() => {}}
            />
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

        {/* Status line — animação de gradiente sutil */}
        {isTyping && (
          <div className="relative flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground overflow-hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00B5AD] animate-pulse" />
            <span>processando…</span>
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00B5AD]/30 to-transparent animate-pulse" />
          </div>
        )}

        {/* Messages */}
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
                    /* Mensagem do usuario — right-aligned, underline catalog */
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-[#0077C0]" />
                        você
                      </span>
                      <span className="border-b border-[#0077C0]/60 pb-0.5 text-sm leading-relaxed text-foreground max-w-[85%]">
                        {text}
                      </span>
                    </div>
                  ) : (
                    /* Resposta do assistente — catalog card com border-left */
                    <div
                      className="border-l-2 pl-4 transition-colors hover:border-[#00B5AD]"
                      style={{ borderColor: msg.id === "welcome" ? "#00B5AD" : "#0077C0" }}
                    >
                      <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: msg.id === "welcome" ? "#00B5AD" : "#0077C0" }} />
                        <span>GUIÁ</span>
                        <MsgCounter n={i} />
                      </div>
                      <div
                        className="text-sm leading-relaxed text-foreground whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: renderWithThinking(text) }}
                      />
                    </div>
                  )}
                </div>
              )
            })}

            {isTyping && (
              <div className="border-l-2 border-[#00B5AD]/40 pl-4 animate-fade-in">
                <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00B5AD] animate-pulse" />
                  GUIÁ · pensando…
                </div>
                <div className="flex gap-1.5 py-1">
                  {[0, 1, 2].map((j) => (
                    <span
                      key={j}
                      className="h-1.5 w-1.5 rounded-full bg-[#00B5AD]/50 animate-bounce"
                      style={{ animationDelay: `${j * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="border-l-2 border-red-500 pl-4 animate-fade-in">
                <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-red-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  erro
                </div>
                <div className="text-sm text-red-500 mb-2">
                  Não foi possível conectar. Tente novamente.
                </div>
                <button
                  onClick={() => setMessages(messages.filter((m) => m.role === "assistant").slice(0, 1))}
                  className="cursor-pointer font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 border border-border rounded-md hover:bg-muted"
                >
                  Reiniciar conversa
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick questions — catalog tags com dots */}
        {messages.length <= 1 && !isTyping && (
          <div className="border-t border-border px-5 py-3">
            <div className="mb-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
              tópicos sugeridos
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q.query}
                  onClick={() => handleSend(q.query)}
                  className="cursor-pointer group/q flex items-center gap-2 font-mono text-xs text-muted-foreground transition-all hover:text-foreground px-3 py-1.5 rounded-full border border-border/60 hover:border-[#00B5AD]/40 hover:bg-[#00B5AD]/5"
                >
                  <span className="h-2 w-2 rounded-full transition-transform group-hover/q:scale-125" style={{ backgroundColor: q.color }} />
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input — underline search style */}
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
                onClick={handleStop}
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