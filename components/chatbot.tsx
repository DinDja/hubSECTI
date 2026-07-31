"use client"

import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react"
import { X, ArrowUp, MessageSquare, Copy, Check, RotateCcw, HelpCircle, ChevronDown, BrainCircuit } from "lucide-react"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { getAllChatSnapshots, clearAllChatSnapshots } from "@/lib/chat-store"
import { useLocalLLM, type ChatCompletionMessageParam, type GenerateToken } from "@/lib/local-llm"
import { useLocalLLMMode, type ModelChoice, MODEL_OPTIONS, isThinkingCapableModel } from "@/lib/local-llm-context"
import { DownloadModelButton } from "@/components/download-model-button"
import { PerfOverlay } from "@/components/perf-overlay"
import { TutorialPanel } from "@/components/chatbot-tutorial"
import { allEntries, type KnowledgeEntry } from "@/lib/chatbot-knowledge"
import { rankEntries } from "@/lib/nlu/scorer"
import { detectIntent, type Intent } from "@/lib/nlu/intent"

function buildLocalSystemPrompt(query: string, context?: string): string {
  const ranked = rankEntries(allEntries, query).slice(0, 2)
  const ctxEntries: KnowledgeEntry[] = ranked.length > 0
    ? ranked.map((s) => s.entry)
    : []

  const knowledge = ctxEntries
    .map((e) => `- ${e.title}: ${e.content.split("\n")[0]}`)
    .join("\n")

  const live = context ? `\nDados ao vivo:\n${context.slice(0, 300)}` : ""
  const ref = knowledge ? `\n\nReferencia relevante:\n${knowledge}` : ""

  return `Voce e o GUIA, assistente do Hub SECTI (Secretaria de Ciencia, Tecnologia e Inovacao da Bahia).

REGRAS:
- Responda como GUIA. Nunca diga que e outra coisa.
- Seja curto e direto, em portugues, texto plano.
- Nao inclua raciocinio, pensamento ou explicacao do processo na resposta.
- O Hub SECTI reune 13 sistemas (gestao, dados, pesquisa, comunicacao).
- A SECTI fica na Bahia, capital Salvador.${live}${ref}`
}

type QuickQuestion = { label: string; query: string; color: string; desc: string }

const QUICK_QUESTIONS: QuickQuestion[] = [
  { label: "Sistemas", query: "Quais sistemas estão disponíveis?", color: "#00B5AD", desc: "Lista de sistemas integrados" },
  { label: "Projetos", query: "Quantos projetos existem?", color: "#0077C0", desc: "Projetos cadastrados" },
  { label: "Conecta Bahia", query: "Dados do Conecta Bahia", color: "#7AC143", desc: "Indicadores de conectividade" },
  { label: "SECTI", query: "O que é a SECTI?", color: "#F7941D", desc: "Sobre a secretaria" },
  { label: "Territórios", query: "Quantos territórios tem a Bahia?", color: "#EC008C", desc: "Divisão territorial" },
  { label: "Notícias", query: "Últimas notícias", color: "#ED1C24", desc: "Atualizações recentes" },
]

const INITIAL_MESSAGES: UIMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    parts: [{ type: "text", text: "Sou o GUIÁ, assistente do Hub SECTI. Consulto sistemas, projetos (ao vivo), Conecta Bahia, territórios e mais.\n\nComo posso ajudar?" }],
  },
]

function stripThinking(text: string): string {
  let result = text
    .replace(/<\/?think>/gi, "")
    .replace(/<\/?thought>/gi, "")
    .replace(/<\/?reasoning>/gi, "")
    .replace(/\*\*Pensamento:\*\*[\s\S]*?\*\*Resposta:\*\*/gi, "")
    .replace(/\*\*Racioc[íi]nio:\*\*[\s\S]*?\*\*Resposta:\*\*/gi, "")
    .replace(/^[\s\S]*?\*\*Resposta:\*\*/gim, "")
    .trim()

  // Remove leading English thinking monologue (Qwen3 small models ignore enable_thinking)
  // Multi-paragraph output where first paragraph starts with planning/self-talk markers
  const THINKING_MARKERS = [
    /^(Okay|Ok)[,\s]/i,
    /^Let me\b/i,
    /^I (need|think|should|will|can|am|want|have|must|would|shall)/i,
    /^Alright\b/i,
    /^First[,\s]/i,
    /^Here'?s\b/i,
    /^My (response|answer|reply|task|goal|role|job|purpose)/i,
    /^The (user|assistant|model|system|conversation|best|correct|appropriate|goal|task)/i,
    /^This (is|user|means|seems|looks|appears|would|should)/i,
    /^So[,\s]/i,
    /^Now[,\s]/i,
    /^Hmm[,\s]/i,
    /^Well[,\s]/i,
  ]
  const paragraphs = result.split(/\n\n+/)
  if (paragraphs.length > 1 && THINKING_MARKERS.some((m) => m.test(paragraphs[0].trim()))) {
    let firstValid = 0
    for (let i = 0; i < paragraphs.length; i++) {
      if (!THINKING_MARKERS.some((m) => m.test(paragraphs[i].trim()))) {
        firstValid = i
        break
      }
    }
    result = paragraphs.slice(firstValid).join("\n\n")
  }

  return result.trim()
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function renderRichText(text: string): string {
  text = stripThinking(text)
  const tokens: string[] = []
  const pattern = /(\*\*(.+?)\*\*)|(\[(.+?)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s<]+)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) tokens.push(escapeHtml(text.slice(last, m.index)))
    if (m[1]) {
      tokens.push(`<strong class="font-semibold">${escapeHtml(m[2])}</strong>`)
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

const MessageContent = memo(function MessageContent({ text }: { text: string }) {
  const html = useMemo(() => renderRichText(text), [text])
  return (
    <div
      className="text-[13px] leading-relaxed text-foreground whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})

function MsgCounter({ n }: { n: number }) {
  return <span className="font-mono text-[11px] tabular-nums text-muted-foreground/60">{String(n).padStart(2, "0")}</span>
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
          className="flex h-6 w-6 cursor-pointer items-center justify-center text-muted-foreground/40 opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover/msg:opacity-100"
          aria-label={copied ? "Copiado" : "Copiar mensagem"}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#00B5AD]" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{copied ? "Copiado" : "Copiar mensagem"}</TooltipContent>
    </Tooltip>
  )
}

function getDownloadedModels(): Set<string> {
  const downloaded = new Set<string>()
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith("guia-llm-ready-") && localStorage.getItem(key) === "1") {
        downloaded.add(key.slice("guia-llm-ready-".length))
      }
    }
  } catch {}
  return downloaded
}

type ModelSelectorProps = {
  modelChoice: ModelChoice
  onChangeChoice: (choice: ModelChoice) => void
}

function ModelSelector({ modelChoice, onChangeChoice }: ModelSelectorProps) {
  const groups = [...new Set(MODEL_OPTIONS.map((o) => o.group))]
  const activeOpt = MODEL_OPTIONS.find((o) => o.value === modelChoice)
  const isLocal = modelChoice !== "server"
  const [open, setOpen] = useState(false)
  const [downloaded, setDownloaded] = useState<Set<string>>(() => getDownloadedModels())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setDownloaded(getDownloadedModels())
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-7 cursor-pointer items-center gap-1.5 border-b border-transparent pr-4 text-[11px] text-foreground transition-colors hover:border-border"
        aria-label="Selecionar modelo de IA"
        aria-expanded={open}
      >
        {activeOpt?.logoPath && (
          <img src={activeOpt.logoPath} alt="" className="h-3.5 w-3.5 shrink-0" />
        )}
        {!activeOpt?.logoPath && (
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isLocal ? "bg-[#00B5AD]" : "bg-[#0077C0]"}`} />
        )}
        <span className="truncate max-w-[110px]">{activeOpt?.label ?? "Servidor"}</span>
        <ChevronDown className={`h-3 w-3 shrink-0 text-muted-foreground/60 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[220px] border border-border bg-card shadow-lg">
          {groups.map((group) => (
            <div key={group}>
              <div className="border-b border-border bg-muted/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50">
                {group}
              </div>
              {MODEL_OPTIONS.filter((o) => o.group === group).map((o) => (
                <button
                  key={o.value}
                  onClick={() => { onChangeChoice(o.value); setOpen(false) }}
                  className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[12px] transition-colors hover:bg-muted ${
                    o.value === modelChoice ? "bg-[#00B5AD]/5 font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {o.logoPath ? (
                    <img src={o.logoPath} alt="" className="h-4 w-4 shrink-0" />
                  ) : (
                    <span className={`h-2 w-2 shrink-0 rounded-full ${o.value === "server" ? "bg-[#0077C0]" : "bg-[#00B5AD]"}`} />
                  )}
                  <span className="flex-1 truncate">{o.label}</span>
                  <span className="flex items-center gap-1">
                    {downloaded.has(o.value) && o.value !== modelChoice && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#00B5AD]/60" title="Baixado" />
                    )}
                    {o.value === modelChoice && (
                      <Check className="h-3 w-3 shrink-0 text-[#00B5AD]" strokeWidth={2} />
                    )}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getModelDisplayName(modelId: string | null): string {
  if (!modelId) return "glm-4.5-flash (servidor)"
  const opt = MODEL_OPTIONS.find((o) => o.value === modelId)
  if (opt) return `${opt.label.toLowerCase()} (local)`
  return "local"
}

function getContextSourcesForIntent(intent: Intent): string[] | "all" {
  switch (intent) {
    case "conecta_stats": return ["conecta"]
    case "projetos_stats":
    case "projetos_search": return ["projetos"]
    case "noticias": return ["noticias"]
    case "greeting":
    case "thanks":
    case "help":
    case "unknown": return []
    default: return "all"
  }
}

export function Chatbot() {
  const { modelChoice, useLocal, activeModelId, setModelChoice, thinkingEnabled, setThinkingEnabled } = useLocalLLMMode()
  const localLLM = useLocalLLM(activeModelId)

  const useChatInstance = useChat({
    messages: INITIAL_MESSAGES,
  })
  const { messages, sendMessage, status, stop, error, setMessages } = useChatInstance
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [showTutorial, setShowTutorial] = useState(false)
  const [showEmptyHint, setShowEmptyHint] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [localRunning, setLocalRunning] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const msgModelRef = useRef<Map<string, string>>(new Map())
  const msgReasoningRef = useRef<Map<string, string>>(new Map())
  const rafPendingRef = useRef(false)
  const streamContentRef = useRef<{ id: string; content: string } | null>(null)

  const isTyping = (status === "submitted" || status === "streaming") || localRunning
  const msgCount = messages.filter((m) => m.role === "assistant").length

  useEffect(() => {
    if (typeof window === "undefined") return
    const onOpen = () => setIsOpen(true)
    window.addEventListener("guia:open", onOpen)
    return () => window.removeEventListener("guia:open", onOpen)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping, isOpen])

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  useEffect(() => {
    if (messages.length > 1) setShowEmptyHint(false)
  }, [messages.length])

  const handleSend = useCallback(async (query: string) => {
    const text = query.trim()
    if (!text || isTyping) return
    setInput("")
    setShowEmptyHint(false)

    const snapshots = await getAllChatSnapshots()
    const intent = detectIntent(text)
    const relevantSources = getContextSourcesForIntent(intent.intent)
    const filteredSnapshots = relevantSources === "all"
      ? snapshots
      : snapshots.filter((s) => relevantSources.includes(s.source))
    const context = filteredSnapshots
      .map((s) => `[Fonte: ${s.source}]\n${s.content}`)
      .join("\n\n")

    if (useLocal && localLLM.isReady && activeModelId) {
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
        let contentAcc = ""
        let reasoningAcc = ""
        rafPendingRef.current = false
        for await (const token of localLLM.generate(conv, {
          temperature: 0.7,
          max_tokens: 800,
          signal: controller.signal,
          enable_thinking: thinkingEnabled,
        })) {
          if (token.type === "reasoning") {
            reasoningAcc += token.text
          } else {
            contentAcc += token.text
          }
          if (!rafPendingRef.current) {
            rafPendingRef.current = true
            streamContentRef.current = { id: assistantMsgId, content: contentAcc }
            requestAnimationFrame(() => {
              rafPendingRef.current = false
              const sc = streamContentRef.current
              if (!sc) return
              const cleanText = stripThinking(sc.content)
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === sc.id
                    ? { ...m, parts: [{ type: "text" as const, text: cleanText }] }
                    : m
                )
              )
            })
          } else {
            streamContentRef.current = { id: assistantMsgId, content: contentAcc }
          }
        }
        if (contentAcc) {
          const cleanText = stripThinking(contentAcc)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, parts: [{ type: "text" as const, text: cleanText }] }
                : m
            )
          )
          msgModelRef.current.set(assistantMsgId, getModelDisplayName(activeModelId))
          if (reasoningAcc) msgReasoningRef.current.set(assistantMsgId, reasoningAcc)
          setMessages((prev) => [...prev])
          return
        }
        console.warn("Local LLM: resposta vazia, fallback para servidor")
      } catch (err) {
        console.warn("Local LLM: erro, fallback para servidor", err)
      } finally {
        rafPendingRef.current = false
        streamContentRef.current = null
        setLocalRunning(false)
        abortRef.current = null
      }

      setMessages(prevMessages)
      await sendMessage(
        { text },
        context ? { body: { context } } : undefined
      )
      return
    }

    const assistantMsgId = `a-${Date.now()}`
    msgModelRef.current.set(assistantMsgId, "glm-4.5-flash (servidor)")
    await sendMessage(
      { text },
      context ? { body: { context } } : undefined
    )
  }, [isTyping, useLocal, localLLM, activeModelId, messages, sendMessage, setMessages, thinkingEnabled])

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
    setShowEmptyHint(true)
    clearAllChatSnapshots()
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
      <PerfOverlay active={isOpen && useLocal} />

      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`cursor-pointer group fixed z-[60] flex items-center gap-3 border border-border bg-card px-4 py-2.5 shadow-sm transition-all duration-300 hover:border-[#00B5AD]/40 hover:bg-muted ${
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

      {/* Panel */}
      <div
        className={`fixed z-[60] flex flex-col bg-card transition-all duration-300 ${
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        } inset-0 h-full max-sm:border-0 sm:inset-auto sm:top-auto sm:bottom-6 sm:right-6 sm:h-auto sm:w-[440px] sm:max-h-[min(640px,calc(100dvh-3rem))] sm:border sm:border-border`}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        {/* Header */}
        <header className="relative shrink-0 border-b border-border bg-card">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#00B5AD] via-[#0077C0] to-[#7AC143]" />
          {/* Row 1: identity + actions */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center border border-border bg-background">
                <img src="/img/GUIA.svg" alt="GUIÁ" className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold tracking-tight text-foreground leading-none">GUIÁ</h3>
                <span className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
                  Assistente Hub SECTI
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowTutorial(true)}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Como funciona o GUIÁ"
                  >
                    <HelpCircle className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Como funciona</TooltipContent>
              </Tooltip>
              {useLocal && activeModelId && isThinkingCapableModel(activeModelId) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setThinkingEnabled(!thinkingEnabled)}
                      className={`flex h-7 w-7 cursor-pointer items-center justify-center transition-colors hover:bg-muted ${
                        thinkingEnabled
                          ? "text-[#F59E0B] hover:text-[#F59E0B]"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      aria-label={thinkingEnabled ? "Desativar pensamento profundo" : "Ativar pensamento profundo"}
                    >
                      <BrainCircuit className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {thinkingEnabled ? "Pensamento profundo: ligado" : "Pensamento profundo: desligado"}
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleNewChat}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Nova conversa"
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Nova conversa</TooltipContent>
              </Tooltip>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Fechar chat"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
          {/* Row 2: model selector + status */}
          <div className="flex items-center justify-between px-4 pb-2.5">
            <div className="flex items-center gap-2">
              <ModelSelector
                modelChoice={modelChoice}
                onChangeChoice={setModelChoice}
              />
            </div>
            <div className="flex items-center gap-2">
              {useLocal && (
                <div className="hidden sm:block">
                  <DownloadModelButton
                    state={localLLM.state}
                    onStart={() => {
                      if (activeModelId) localLLM.startDownload(activeModelId)
                    }}
                  />
                </div>
              )}
              <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50">
                <span className={`h-1 w-1 rounded-full ${useLocal ? "bg-[#00B5AD]" : "bg-[#0077C0]"}`} />
                {useLocal ? "local" : "servidor"}
              </div>
              <MsgCounter n={Math.max(0, msgCount - 1)} />
            </div>
          </div>
        </header>

        {/* Local model not ready notice */}
        {useLocal && !localLLM.isReady && localLLM.state.status !== "unset" && localLLM.state.status !== "error" && (
          <div className="shrink-0 border-b border-border bg-[#00B5AD]/[0.03] px-4 py-2">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00B5AD] animate-pulse" />
              <span>
                {localLLM.state.status === "downloading"
                  ? `baixando modelo · ${Math.round(localLLM.state.progress * 100)}%`
                  : localLLM.state.status === "loading-cache"
                    ? "carregando do cache…"
                    : localLLM.state.status === "loading-model"
                      ? "preparando modelo…"
                      : "iniciando…"}
              </span>
            </div>
          </div>
        )}

        {/* Local model not ready — activation hint */}
        {useLocal && !localLLM.isReady && localLLM.state.status === "unset" && (
          <div className="shrink-0 border-b border-border bg-muted/40 px-4 py-2.5">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 sm:hidden">
                <DownloadModelButton
                  state={localLLM.state}
                  onStart={() => {
                    if (activeModelId) localLLM.startDownload(activeModelId)
                  }}
                />
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Modelo local selecionado. Clique no indicador{" "}
                <button
                  onClick={() => {
                    if (activeModelId) localLLM.startDownload(activeModelId)
                  }}
                  className="inline-flex items-center gap-1 font-medium text-[#00B5AD] underline underline-offset-2 hover:text-[#0077C0] transition-colors"
                >
                  para baixar
                </button>{" "}
                ou troque para <span className="font-medium">Servidor</span> no seletor acima.
              </p>
            </div>
          </div>
        )}

        {/* Status line */}
        {isTyping && (
          <div className="relative flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground overflow-hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00B5AD] animate-pulse" />
            <span>processando…</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
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
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-[#0077C0]" />
                        você
                      </span>
                      <span className="border-b border-[#0077C0]/60 pb-0.5 text-[13px] leading-relaxed text-foreground max-w-[85%]">
                        {text}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="group/msg border-l-2 pl-3.5 transition-colors hover:border-[#00B5AD]"
                      style={{ borderColor: msg.id === "welcome" ? "#00B5AD" : "#0077C0" }}
                    >
                      <div className="mb-1.5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
                        <span className="h-1 w-1 rounded-full" style={{ backgroundColor: msg.id === "welcome" ? "#00B5AD" : "#0077C0" }} />
                        <span>GUIÁ</span>
                        <MsgCounter n={i} />
                        {msg.id !== "welcome" && text && <CopyButton text={text} />}
                      </div>
                      <MessageContent text={text} />

                      {msg.id !== "welcome" && msgReasoningRef.current.has(msg.id) && (
                        <details className="mt-2 border border-muted/50 bg-muted/20">
                          <summary className="cursor-pointer px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-amber-600/70 hover:text-amber-600 select-none">
                            raciocínio
                          </summary>
                          <div className="border-t border-muted/50 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-muted-foreground/80 whitespace-pre-wrap">
                            {msgReasoningRef.current.get(msg.id)}
                          </div>
                        </details>
                      )}
                      {msg.id !== "welcome" && (
                        <div className="mt-1.5 font-mono text-[8px] uppercase tracking-wider text-muted-foreground/35">
                          via {msgModelRef.current.get(msg.id) ?? "glm-4.5-flash (servidor)"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {isTyping && (
              <div className="border-l-2 border-[#00B5AD]/40 pl-3.5 animate-fade-in">
                <div className="mb-1.5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
                  <span className="h-1 w-1 rounded-full bg-[#00B5AD] animate-pulse" />
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
              <div className="border-l-2 border-red-500 pl-3.5 animate-fade-in">
                <div className="mb-1.5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-red-500">
                  <span className="h-1 w-1 rounded-full bg-red-500" />
                  erro
                </div>
                <div className="text-[13px] text-red-500 mb-2">
                  Não foi possível conectar. Tente novamente.
                </div>
                <button
                  onClick={() => setMessages(messages.filter((m) => m.role === "assistant").slice(0, 1))}
                  className="cursor-pointer font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 border border-border hover:bg-muted"
                >
                  Reiniciar conversa
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Empty state — topics */}
        {showEmptyHint && messages.length <= 1 && !isTyping && (
          <div className="shrink-0 border-t border-border px-4 py-3">
            <div className="mb-2.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              tópicos sugeridos
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q.query}
                  onClick={() => handleSend(q.query)}
                  className="group/q flex flex-col gap-0.5 border border-border/60 bg-background px-2.5 py-2 text-left transition-all hover:border-foreground/20 hover:bg-muted"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full transition-transform group-hover/q:scale-125" style={{ backgroundColor: q.color }} />
                    <span className="text-[11px] font-medium text-foreground">{q.label}</span>
                  </div>
                  <span className="pl-3.5 font-mono text-[9px] text-muted-foreground/50">{q.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 border-t border-border px-4 py-3">
          <div className="relative flex items-center">
            <MessageSquare className="absolute left-0 h-4 w-4 text-muted-foreground/60" strokeWidth={1.5} />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="pergunte ao GUIÁ…"
              className="w-full border-b border-border bg-transparent py-2.5 pl-6 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-foreground"
            />
            {isTyping ? (
              <button
                onClick={handleStop}
                className="absolute right-0 flex h-8 w-8 cursor-pointer items-center justify-center text-muted-foreground transition-all hover:text-red-500"
                aria-label="Parar"
              >
                <span className="h-3 w-3 bg-current" />
              </button>
            ) : (
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isTyping}
                className="absolute right-0 flex h-8 w-8 cursor-pointer items-center justify-center text-muted-foreground transition-all hover:border-[#0077C0] hover:text-[#0077C0] disabled:cursor-default disabled:opacity-30 disabled:hover:text-muted-foreground"
                aria-label="Enviar"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tutorial overlay */}
      <TutorialPanel open={showTutorial} onClose={() => setShowTutorial(false)} />
    </>
  )
}
