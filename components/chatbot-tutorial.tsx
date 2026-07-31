"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X, Cpu, Cloud, Download, Zap, Lock, AlertTriangle, Check, ChevronRight } from "lucide-react"
import { ReactNode } from "react"

type Props = {
  open: boolean
  onClose: () => void
}

type Section = {
  id: string
  icon: ReactNode
  label: string
  content: ReactNode
}

const SECTIONS: Section[] = [
  {
    id: "overview",
    icon: <Zap className="h-4 w-4" strokeWidth={1.5} />,
    label: "O que é o GUIÁ",
    content: (
      <>
        <p>
          O <strong>GUIÁ</strong> é o assistente virtual do Hub SECTI. Ele responde perguntas sobre
          sistemas, projetos, territórios e dados da Secretaria de Ciência, Tecnologia e Inovação da Bahia.
        </p>
        <p>
          A diferença em relação a outros chatbots: você escolhe onde a inteligência artificial processa
          sua pergunta. Pode ser no <strong>servidor</strong> (modelo maior, no datacenter) ou{" "}
          <strong>direto no seu navegador</strong> (modelo menor, baixado uma vez e executado localmente).
        </p>
      </>
    ),
  },
  {
    id: "server",
    icon: <Cloud className="h-4 w-4" strokeWidth={1.5} />,
    label: "Modelo no Servidor",
    content: (
      <>
        <p>
          No modo servidor, sua pergunta viaja para o datacenter e é processada por um modelo
          grande chamado <span className="font-mono text-[11px]">GLM-4.5-flash</span> (GPT-style, bilhões de parâmetros).
          O servidor responde e o texto aparece aqui.
        </p>
        <div className="my-3 space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">vantagens</p>
          <List items={[
            "Respostas mais completas e contextualizadas (modelo grande, fino)",
            "Não consome memória nem processamento do seu dispositivo",
            "Disponível em qualquer aparelho, inclusive celular",
            "Funciona mesmo em conexões lentas (viaja só texto)",
          ]} />
          <p className="mt-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">desvantagens</p>
          <List items={[
            "Requer conexão com internet — sem rede, sem resposta",
            "Sua pergunta sai do seu dispositivo (privacidade: dados transitam pelo servidor)",
            "Latência de rede (ida e volta até o datacenter)",
          ]} negative />
        </div>
        <div className="border border-border bg-muted/40 px-3 py-2.5">
          <p className="text-[12px] leading-relaxed">
            <strong>Quando usar:</strong> situações comuns, quando você precisa de respostas detalhadas,
            está em conexão estável, ou o conteúdo da pergunta não é sensível.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "local",
    icon: <Cpu className="h-4 w-4" strokeWidth={1.5} />,
    label: "Modelo Local (no navegador)",
    content: (
      <>
        <p>
          No modo local, um modelo de IA é baixado uma única vez (entre 0.5 e 2 GB, dependendo do modelo)
          e executado inteiramente dentro do seu navegador, usando WebGPU ou WASM. Nenhuma informação
          sai do seu dispositivo — a inferência acontece aqui.
        </p>
        <div className="my-3 space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">vantagens</p>
          <List items={[
            "100% privado: nenhum dado sai do seu dispositivo",
            "Funciona sem internet (depois que o modelo está baixado)",
            "Sem latência de rede — a resposta começa imediatamente",
            "Gratuito, sem limites de uso nem custos por requisição",
          ]} />
          <p className="mt-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">desvantagens</p>
          <List items={[
            "Download inicial do modelo pode demorar (0.5 a 2 GB)",
            "Consome RAM e CPU/GPU do dispositivo (recomendamos 4 GB+ de RAM)",
            "Modelos pequenos (0.5B–3B) respondem menos bem que um modelo de bilhões de parâmetros",
            "Pode aquecer o dispositivo em conversas longas",
            "Não recomendado em celular (memória limitada — o sistema usa servidor automaticamente)",
          ]} negative />
        </div>
        <div className="border border-border bg-muted/40 px-3 py-2.5">
          <p className="text-[12px] leading-relaxed">
            <strong>Quando usar:</strong> perguntas sensíveis ou confidenciais, ambientes sem internet
            estável, ou quando você quer entender como IA local funciona na prática.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "models",
    icon: <Cpu className="h-4 w-4" strokeWidth={1.5} />,
    label: "Modelos disponíveis",
    content: (
      <>
        <p>
          Todos os modelos locais usam <span className="font-mono text-[11px]">WebLLM</span> da biblioteca{" "}
          <span className="font-mono text-[11px]">@mlc-ai/web-llm</span>, executando via WebGPU/WASM no navegador.
          São modelos <strong>quantizados</strong> (comprimidos) e otimizados para rodar sem driver de vídeo dedicado.
        </p>
        <div className="my-3 overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50">
                <th className="py-2 pr-3 font-normal">Modelo</th>
                <th className="py-2 px-3 font-normal">Parâmetros</th>
                <th className="py-2 px-3 font-normal">RAM aprox.</th>
                <th className="py-2 pl-3 font-normal">Origem</th>
              </tr>
            </thead>
            <tbody className="font-sans">
              <Row name="Qwen 2.5 0.5B" params="0.5B" ram="1.1 GB" origem="Alibaba" />
              <Row name="Qwen 2.5 1.5B" params="1.5B" ram="1.9 GB" origem="Alibaba" highlight />
              <Row name="Qwen 3 0.6B" params="0.6B" ram="1.9 GB" origem="Alibaba" />
              <Row name="Qwen 3.5 0.8B" params="0.8B" ram="1.9 GB" origem="Alibaba" />
              <Row name="Qwen 3 1.7B" params="1.7B" ram="2.6 GB" origem="Alibaba" />
              <Row name="Llama 3.2 3B" params="3B" ram="3.0 GB" origem="Meta" />
              <Row name="Gemma 2 2B" params="2B" ram="2.5 GB" origem="Google" />
            </tbody>
          </table>
        </div>
        <div className="border border-border bg-muted/40 px-3 py-2.5">
          <p className="text-[12px] leading-relaxed">
            <strong className="text-foreground">Recomendação:</strong> para a maioria dos usuários,
            <span className="font-medium"> Qwen 2.5 1.5B</span> oferece o melhor equilíbrio entre qualidade
            de resposta e consumo de recursos. Se seu dispositivo tiver pouca memória, comece com{" "}
            <span className="font-medium">Qwen 2.5 0.5B</span>.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "how-to",
    icon: <Download className="h-4 w-4" strokeWidth={1.5} />,
    label: "Como usar",
    content: (
      <>
        <div className="space-y-3">
          <Step n={1} title="Selecione o modelo no cabeçalho do chat">
            Use o menu suspenso ao lado do indicador "local/servidor". Os modelos estão agrupados por família
            (Qwen, Llama, Google, etc.). Escolha um modelo local.
          </Step>
          <Step n={2} title="Baixe o modelo (uma única vez)">
            Ao selecionar um modelo local pela primeira vez, clique no indicador circular no cabeçalho
            (botão com ícone de download) para iniciar o carregamento. O download aparece como porcentagem
            dentro do círculo.
          </Step>
          <Step n={3} title="Aguarde o download">
            O tempo depende da sua conexão e do tamanho do modelo (0.5 a 2 GB). Depois de baixado,
            o modelo fica em cache no navegador — nas próximas visitas, o carregamento é quase instantâneo.
          </Step>
          <Step n={4} title="Converse normalmente">
            Quando o indicador ficar verde com um <Check className="inline h-3 w-3" />, o modelo está pronto.
            Suas perguntas agora são processadas localmente. O rótulo "via [modelo] (local)" confirma isso.
          </Step>
          <Step n={5} title="Troque a qualquer momento">
            Você pode alternar entre local e servidor no menu suspenso durante a conversa.
            Os modelos locais podem ser trocados também — o sistema descarrega o anterior e carrega o novo.
          </Step>
        </div>
      </>
    ),
  },
  {
    id: "comparison",
    icon: <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />,
    label: "Qual escolher?",
    content: (
      <>
        <p>
          Não existe "melhor" absoluto — depende do contexto. O sistema usa servidor por padrão
          (ideal para a maioria das situações), mas você pode alternar quando quiser.
        </p>
        <div className="my-3 overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50">
                <th className="py-2 pr-3 font-normal"></th>
                <th className="py-2 px-3 font-normal text-[#0077C0]">Servidor (GLM-4.5)</th>
                <th className="py-2 pl-3 font-normal text-[#00B5AD]">Local (Qwen, Llama...)</th>
              </tr>
            </thead>
            <tbody className="font-sans">
              <Row2 label="Qualidade das respostas" server="Alta (modelo grande)" local="Média (modelo leve)" highlight="server" />
              <Row2 label="Privacidade" server="Dados trafegam pela rede" local="100% no dispositivo" highlight="local" />
              <Row2 label="Internet" server="Obrigatória" local="Não (após baixar o modelo)" highlight="local" />
              <Row2 label="Consumo de RAM" server="Nenhum" local="1.1 a 3 GB (conforme modelo)" highlight="server" />
              <Row2 label="Latência da 1ª palavra" server="Varia (rede)" local="Instantânea (sem rede)" highlight="local" />
              <Row2 label="Funciona em celular" server="Sim" local="Não recomendado" highlight="server" />
              <Row2 label="Custo" server="Limitado ao servidor" local="Gratuito, sem limites" highlight="local" />
            </tbody>
          </table>
        </div>
        <div className="border border-[#00B5AD]/30 bg-[#00B5AD]/[0.03] px-3 py-2.5">
          <p className="text-[12px] leading-relaxed">
            <strong className="text-foreground">Resumo prático:</strong>{" "}
            para uso diário, fique no servidor. Use local quando precisar de privacidade,
            quando estiver offline, ou para experimentar IA no navegador.
            Em caso de erro ou resposta vazia do modelo local, o sistema cai automaticamente para o servidor.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "tips",
    icon: <Lock className="h-4 w-4" strokeWidth={1.5} />,
    label: "Privacidade e dados",
    content: (
      <>
        <p>
          <strong>Servidor:</strong> sua pergunta é enviada para o backend via conexão segura (HTTPS) e
          processada por um modelo hospedado. O histórico fica no seu navegador, mas o texto da pergunta
          transita pela rede. Nenhum dado pessoal é armazenado no servidor após a resposta.
        </p>
        <p className="mt-2">
          <strong>Local:</strong> nenhuma informação sai do seu dispositivo. O modelo, baixado uma vez,
          executa inteiramente no seu navegador via WebGPU/WASM. Mesmo offline, depois de carregado,
          funciona sem nenhuma comunicação externa.
        </p>
        <p className="mt-2">
          <strong>Cache:</strong> o modelo baixado fica armazenado no cache do navegador (Cache API ou IndexedDB).
          Você pode limpá-lo nas configurações do navegador — procure por "GUIA" ou "webllm" no armazenamento.
        </p>
      </>
    ),
  },
]

function List({ items, negative }: { items: string[]; negative?: boolean }) {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed">
          <span
            className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
              negative ? "bg-red-500/40" : "bg-[#00B5AD]/50"
            }`}
          />
          <span className="text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Row({ name, params, ram, origem, highlight }: { name: string; params: string; ram: string; origem: string; highlight?: boolean }) {
  return (
    <tr className={`border-b border-border/40 ${highlight ? "bg-[#00B5AD]/[0.03]" : ""}`}>
      <td className="py-1.5 pr-3 font-medium text-foreground">{name}{highlight && <span className="ml-1.5 font-mono text-[8px] uppercase text-[#00B5AD]">recomendado</span>}</td>
      <td className="py-1.5 px-3 font-mono text-[10px] text-muted-foreground">{params}</td>
      <td className="py-1.5 px-3 font-mono text-[10px] text-muted-foreground">{ram}</td>
      <td className="py-1.5 pl-3 text-[10px] text-muted-foreground">{origem}</td>
    </tr>
  )
}

function Row2({ label, server, local, highlight }: { label: string; server: string; local: string; highlight: "server" | "local" }) {
  return (
    <tr className="border-b border-border/40">
      <td className="py-1.5 pr-3 font-medium text-foreground">{label}</td>
      <td className={`py-1.5 px-3 ${highlight === "server" ? "text-[#0077C0] font-medium" : "text-muted-foreground"}`}>{server}</td>
      <td className={`py-1.5 pl-3 ${highlight === "local" ? "text-[#00B5AD] font-medium" : "text-muted-foreground"}`}>{local}</td>
    </tr>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center border border-border font-mono text-[11px] text-muted-foreground">
        {n}
      </div>
      <div className="flex-1 pb-1">
        <p className="font-medium text-foreground text-[12px]">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}

export function TutorialPanel({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [activeSection, setActiveSection] = useState("overview")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(t)
    }
    setVisible(false)
  }, [open])

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onEsc)
    return () => window.removeEventListener("keydown", onEsc)
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />
      {/* Panel */}
      <div
        className={`relative flex h-full max-h-[85vh] w-full max-w-[680px] flex-col overflow-hidden border border-border bg-card shadow-xl transition-all duration-200 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#00B5AD] via-[#0077C0] to-[#7AC143]" />
        <header className="flex shrink-0 items-center justify-between border-b border-border px-5 pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center border border-border bg-background">
              <img src="/img/GUIA.svg" alt="GUIÁ" className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Como funciona o GUIÁ</h2>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
                Modelos locais vs servidor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Fechar tutorial"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </header>

        {/* Body: sidebar + content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar nav */}
          <nav className="hidden shrink-0 border-r border-border bg-muted/20 sm:block">
            <div className="w-[180px] py-3">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-[12px] transition-colors ${
                    activeSection === s.id
                      ? "bg-card font-medium text-foreground"
                      : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                  }`}
                >
                  <span className={activeSection === s.id ? "text-[#00B5AD]" : "text-muted-foreground/60"}>
                    {s.icon}
                  </span>
                  <span className="flex-1 truncate">{s.label}</span>
                  {activeSection === s.id && (
                    <ChevronRight className="h-3 w-3 text-[#00B5AD]" />
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Content — scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
            {/* Mobile section selector */}
            <div className="mb-4 sm:hidden">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                className="h-9 w-full cursor-pointer appearance-none border border-border bg-background px-3 pr-8 font-mono text-[11px] text-foreground"
                aria-label="Selecionar seção"
              >
                {SECTIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Active section */}
            {SECTIONS.map((s) => (
              activeSection === s.id && (
                <div key={s.id} className="animate-fade-in">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-[#00B5AD]">{s.icon}</span>
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">{s.label}</h3>
                  </div>
                  <div className="space-y-2.5 text-[12px] leading-relaxed text-muted-foreground">
                    {s.content}
                  </div>
                </div>
              )
            ))}

            {/* Nav arrows */}
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              {(() => {
                const idx = SECTIONS.findIndex((s) => s.id === activeSection)
                const prev = idx > 0 ? SECTIONS[idx - 1] : null
                const next = idx < SECTIONS.length - 1 ? SECTIONS[idx + 1] : null
                return (
                  <>
                    {prev ? (
                      <button
                        onClick={() => setActiveSection(prev.id)}
                        className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ChevronRight className="h-3 w-3 rotate-180" />
                        {prev.label}
                      </button>
                    ) : <span />}
                    {next ? (
                      <button
                        onClick={() => setActiveSection(next.id)}
                        className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {next.label}
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    ) : <span />}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
