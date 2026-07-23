"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { X, ArrowUp, MessageSquare, Copy, Check, RotateCcw, Cpu, Cloud } from "lucide-react"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { getAllChatSnapshots } from "@/lib/chat-store"
import { useLocalLLM, type ChatCompletionMessageParam, type GenerateToken } from "@/lib/local-llm"
import { useLocalLLMMode } from "@/lib/local-llm-context"
import { DownloadModelButton } from "@/components/download-model-button"
import { allEntries, type KnowledgeEntry } from "@/lib/chatbot-knowledge"
import { rankEntries } from "@/lib/nlu/scorer"

// RAG: seleciona top-N entradas relevantes ah pergunta e monta prompt focado.
// Modelo local (Llama-3.2-1B) tem contexto limitado; injetar tudo desperdica espaço.
function buildLocalSystemPrompt(query: string, context?: string): string {
  // Ranking por relevância usando o pipeline NLU existente
  const ranked = rankEntries(allEntries, query).slice(0, 5)
  // Se nada relevante, fallback para resumo geral curto
  const ctxEntries: KnowledgeEntry[] = ranked.length > 0
    ? ranked.map((s) => s.entry)
    : allEntries.filter((e) => ["sobre-hub", "sobre-secti", "sistemas-disponiveis", "saudacao"].includes(e.id))

  const knowledge = ctxEntries
    .map((e) => {
      const links = e.links ? ` (${e.links.map((l) => l.url).join(", ")})` : ""
      return `### ${e.title}\n${e.content}${links}`
    })
    .join("\n\n")

  const live = context ? `\n\nDados ao vivo:\n${context.slice(0, 500)}` : ""
  return `Voce e o GUIA, assistente do Hub SECTI (Secretaria de Ciencia, Tecnologia e Inovacao da Bahia). Responda em portugues, curto e direto, em texto plano (sem markdown). Use a base de conhecimento abaixo para responder.${live}

Base de conhecimento relevante para "${query}":
${knowledge}`
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigator.clipboard.writeText(text).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1400)
            }).catch(() => {})
          }}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-muted-foreground/50 opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover/msg:opacity-100"
          aria-label={copied ? "Copiado" : "Copiar mensagem"}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#00B5AD]" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{copied ? "Copiado" : "Copiar mensagem"}</TooltipContent>
    </Tooltip>
  )
}

type ModelToggleProps = {
  useLocal: boolean
  localReady: boolean
  onToggle: () => void
}

function ModelToggle({ useLocal, localReady, onToggle }: ModelToggleProps) {
  const Icon = useLocal ? Cpu : Cloud
  const label = useLocal ? "IA local (Llama 3.2 1B)" : "Servidor (z-ai GLM-4.5)"
  const accent = useLocal ? "#00B5AD" : "#0077C0"
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onToggle}
          disabled={!localReady && !useLocal}
          aria-label={`Usando ${label}. Clique para trocar.`}
          className={`group/m flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
            useLocal
              ? "border-[#00B5AD]/40 bg-[#00B5AD]/10 text-[#00B5AD]"
              : "border-[#0077C0]/40 bg-[#0077C0]/10 text-[#0077C0]"
          }`}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
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

  // Toggle de modelo via context global (também controla overlay de performance).
  const { mode, toggle: toggleModel } = useLocalLLMMode()
  const useLocal = mode === "local" && localLLM.isReady

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
    if (useLocal && localLLM.isReady) {
      const prevMessages = messages
      const userMsgId = `u-${Date.now()}`
      setMessages([
        ...prevMessages,
        { id: userMsgId, role: "user", parts: [{ type: "text" as const, text }] },
      ])

      const systemPrompt = buildLocalSystemPrompt(text, context)
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
          max_tokens: 800,
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
  }, [isTyping, useLocal, localLLM, localLLM.isReady, messages, sendMessage, setMessages])

  const handleStop = useCallback(() => {
    if (localRunning) {
      abortRef.current?.abort()
      setLocalRunning(false)
    } else {
      stop()
    }
  }, [localRunning, stop])

  const handleNewChat = useCallback(() => {
    handleStop()
    setMessages(INITIAL_MESSAGES)
    setInput("")
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [handleStop, setMessages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  return (
    <>
      {/* Trigger — quadrado catalog-style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`cursor-pointer group fixed z-50 flex items-center gap-3 border border-border bg-card px-4 py-2.5 shadow-sm transition-all duration-300 hover:border-[#00B5AD]/40 hover:bg-muted ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        } right-6 bottom-6 max-sm:right-4 max-sm:bottom-4`}
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
        aria-label="Abrir assistente GUIÁ"
      >
        <div className="relative">
          <img src="/img/GUIA.svg" alt="GUIÁ" className="h-5 w-5" />
          <span className={`absolute -top-1 -right-1 h-2 w-2 rounded-full border-2 border-card ${
            useLocal ? "bg-[#00B5AD]" : "bg-[#0077C0]"
          }`} />
        </div>
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
          GUIÁ
        </span>
      </button>

      {/* Panel — mobile-first: fullscreen no mobile, fixed card no desktop */}
      <div
        className={`fixed z-50 flex flex-col overflow-hidden bg-card transition-all duration-300 ${
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        } inset-0 h-full max-sm:border-0 sm:inset-auto sm:top-auto sm:bottom-6 sm:right-6 sm:h-auto sm:w-[400px] sm:max-h-[620px] sm:rounded-xl sm:border sm:border-border`}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        {/* Header */}
        <header className="relative flex shrink-0 items-center justify-between border-b border-border bg-card px-5 py-4">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#00B5AD] via-[#0077C0] to-[#7AC143]" />
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background">
              <img src="/img/GUIA.svg" alt="GUIÁ" className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${useLocal ? "bg-[#00B5AD]" : "bg-[#0077C0]"}`} />
                {useLocal ? "IA local" : "Servidor"}
              </span>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">GUIÁ</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <DownloadModelButton
                state={localLLM.state}
                onStart={() => {}}
              />
            </div>
            <ModelToggle
              useLocal={useLocal}
              localReady={localLLM.isReady}
              onToggle={toggleModel}
            />
            <MsgCounter n={msgCount - 1} />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleNewChat}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted"
                  aria-label="Nova conversa"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Nova conversa</TooltipContent>
            </Tooltip>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted"
              aria-label="Fechar chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Status line */}
        {isTyping && (
          <div className="relative flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground overflow-hidden">
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
                    <div
                      className="group/msg border-l-2 pl-4 transition-colors hover:border-[#00B5AD]"
                      style={{ borderColor: msg.id === "welcome" ? "#00B5AD" : "#0077C0" }}
                    >
                      <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: msg.id === "welcome" ? "#00B5AD" : "#0077C0" }} />
                        <span>GUIÁ</span>
                        <MsgCounter n={i} />
                        {msg.id !== "welcome" && text && <CopyButton text={text} />}
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

        {/* Quick questions */}
        {messages.length <= 1 && !isTyping && (
          <div className="shrink-0 border-t border-border px-5 py-3">
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

        {/* Input */}
        <div className="shrink-0 border-t border-border px-5 py-4">
          <div className="relative flex items-center">
            <MessageSquare className="absolute left-0 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="pergunte ao GUIÁ…"
              className="w-full border-b border-border bg-transparent py-2.5 pl-6 text-base sm:text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground"
            />
            {isTyping ? (
              <button
                onClick={handleStop}
                className="absolute right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground transition-all hover:border-red-500/40 hover:text-red-500"
                aria-label="Parar"
              >
                <span className="h-3 w-3 bg-current" />
              </button>
            ) : (
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isTyping}
                className="absolute right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground transition-all hover:border-[#0077C0]/40 hover:text-[#0077C0] disabled:opacity-40"
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