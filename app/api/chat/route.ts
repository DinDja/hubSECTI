import { allEntries } from "@/lib/chatbot-knowledge"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
const API_KEY = process.env.ZHIPUAI_API_KEY

const SKIP_IDS = new Set([
  "saudacao", "ajuda-topicos", "agradecimento", "combobox-pesquisa",
  "status-projeto", "buscar-projeto", "territorio-especifico",
])

const COMPACT_IDS = new Set([
  "sistemas-disponiveis", "categorias-sistemas", "territorios-bahia",
  "campos-projeto", "sobre-projetos",
])

function buildSystemPrompt(context?: string): string {
  const ctx = allEntries
    .filter((e) => !SKIP_IDS.has(e.id))
    .map((e) => {
      const c = COMPACT_IDS.has(e.id) ? e.content.split("\n")[0] : e.content
      const links = e.links ? ` Links: ${e.links.map((l) => l.url).join(", ")}` : ""
      return `### ${e.title}\n${c}${links}`
    })
    .join("\n\n")
  const liveSection = context ? `\n\n## Dados atualizados (consultados ao vivo)\n${context}` : ""
  return `Você é o GUIÁ, assistente do Hub SECTI (Secretaria de Ciência, Tecnologia e Inovação da Bahia). Responda em português com **negrito** para números e nomes de sistemas. Seja conciso.

Base de conhecimento:
${ctx}${liveSection}`
}

type UIMessage = {
  id: string
  role: "user" | "assistant"
  parts: { type: string; text?: string }[]
}

function extractText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

export async function POST(req: Request) {
  const { messages, context }: { messages: UIMessage[]; context?: string } = await req.json()

  const apiMessages = [{ role: "system", content: buildSystemPrompt(context) }]
  for (const m of messages) {
    const text = extractText(m)
    if (text) {
      apiMessages.push({ role: m.role === "assistant" ? "assistant" : "user", content: text })
    }
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "glm-4.5-flash",
      messages: apiMessages,
      stream: true,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    return new Response(text, { status: response.status })
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const push = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      push({ type: "start" })
      push({ type: "start-step" })
      push({ type: "text-start", id: "txt-0" })

      let buffer = ""
      let hasContent = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const chunk = line.slice(6).trim()
          if (chunk === "[DONE]") continue
          try {
            const parsed = JSON.parse(chunk)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              hasContent = true
              push({ type: "text-delta", id: "txt-0", delta: content })
            }
          } catch { /* skip */ }
        }
      }

      if (!hasContent) {
        push({ type: "text-delta", id: "txt-0", delta: "Desculpe, não consegui processar sua pergunta agora. Tente novamente." })
      }

      push({ type: "text-end", id: "txt-0" })
      push({ type: "finish-step" })
      push({ type: "finish", finishReason: "stop" })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}