# Hub SECTI

**Plataforma central de acesso aos sistemas e ferramentas da Secretaria de Ciência, Tecnologia e Inovação da Bahia.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Radix UI](https://img.shields.io/badge/Radix_UI-latest-8B5CF6)](https://www.radix-ui.com/)
[![Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify)](https://www.netlify.com/)

---

## 📋 Sobre

O **Hub SECTI** é o portal unificado que concentra todos os sistemas, painéis e ferramentas digitais da Secretaria de Ciência, Tecnologia e Inovação do Estado da Bahia. A plataforma oferece:

- 🗂️ **Catálogo de sistemas** — acesso centralizado a todos os sistemas da secretaria
- 📊 **Painéis de dados** — visualização de indicadores de conectividade, territórios e projetos
- 📰 **Linha do tempo de notícias** — últimas atualizações do portal SECTI
- 🌐 **Integrações em tempo real** — dados ao vivo do Conecta Bahia e SECTI Territórios

---

## 🚀 Tecnologias

| Categoria | Tecnologia |
|-----------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) |
| **Estilização** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Componentes** | [Radix UI](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/) |
| **Temas** | [next-themes](https://github.com/pacocoursey/next-themes) (claro/escuro) |
| **Gerenciador** | [pnpm](https://pnpm.io/) |
| **Deploy** | [Netlify](https://www.netlify.com/) |
| **Analytics** | [Vercel Analytics](https://vercel.com/analytics) |

---

## 📁 Estrutura do Projeto

```
hubSECTI/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── frame-check/          # Verificação de iframe (X-Frame-Options/CSP)
│   │   └── hub/
│   │       ├── conecta/          # Proxy para API Conecta Bahia
│   │       ├── conecta-resumo/   # Dados agregados do Conecta Bahia
│   │       ├── image-proxy/      # Proxy de imagens com cache
│   │       ├── noticias/         # Scraper de notícias do portal SECTI
│   │       └── territorios/      # Proxy para API SECTI Territórios
│   ├── layout.tsx                # Layout raiz com metadados
│   └── page.tsx                  # Página principal (landing page)
├── components/
│   ├── ui/                       # Biblioteca de componentes UI (Radix + Tailwind)
│   ├── header.tsx                # Cabeçalho com navegação
│   ├── hero.tsx                  # Seção hero com timeline de notícias
│   ├── systems-section.tsx       # Grade de sistemas da SECTI
│   ├── about-section.tsx         # Seção "Sobre" com estatísticas
│   ├── hub-integracoes-section.tsx # Cards de integração (Conecta, Territórios)
│   ├── secti-timeline-section.tsx  # Linha do tempo de eventos
│   ├── footer.tsx                # Rodapé
│   └── ...
├── lib/
│   ├── conecta-coverage.ts       # Lógica de cobertura do Conecta Bahia
│   ├── conecta-reference.ts      # Valores de referência/fallback
│   ├── image-proxy.ts            # Utilitário de proxy de imagens
│   └── utils.ts                  # Funções utilitárias
├── integrations/
│   └── netlify-functions/        # Funções serverless auxiliares
│       ├── mapfilter-BA/         # Função de mapeamento EPT
│       └── SECTI_TERRITORIOS/    # Função de dados territoriais
├── public/                       # Assets estáticos
├── netlify.toml                  # Configuração de deploy no Netlify
├── next.config.mjs               # Configuração do Next.js
├── tsconfig.json                 # Configuração do TypeScript
└── package.json                  # Dependências e scripts
```

---

## 🔌 APIs e Integrações

### Rotas da API

| Rota | Descrição |
|------|-----------|
| `GET /api/hub/conecta` | Proxy para dados do **Conecta Bahia** (pontos de Wi-Fi) |
| `GET /api/hub/conecta-resumo` | Resumo agregado: municípios, territórios e pontos instalados |
| `GET /api/hub/territorios` | Proxy para dados do **SECTI Territórios** |
| `GET /api/hub/noticias` | Scraper de notícias do portal oficial da SECTI |
| `GET /api/frame-check?url=` | Verifica se uma URL permite ser carregada em iframe |
| `GET /api/hub/image-proxy/[...]` | Proxy de imagens com cache otimizado |

### Fontes de Dados Externas

- **Conecta Bahia** — `conectabahia.netlify.app` — dados de conectividade e pontos Wi-Fi
- **SECTI Territórios** — `secti-territorios.netlify.app` — dados de mapeamento territorial
- **Portal SECTI** — `www.ba.gov.br/secti/noticias` — notícias oficiais da secretaria

---

## 🛠️ Desenvolvimento

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/installation) (gerenciador de pacotes)

### Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd hubSECTI

# Instale as dependências
pnpm install

# Inicie o servidor de desenvolvimento
pnpm dev
```

O projeto estará disponível em **http://localhost:3000**.

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Inicia servidor de desenvolvimento com hot-reload |
| `pnpm build` | Gera build de produção |
| `pnpm start` | Inicia servidor de produção |
| `pnpm lint` | Executa ESLint no projeto |

---

## 🚢 Deploy

O projeto é configurado para deploy contínuo no **Netlify** com o plugin `@netlify/plugin-nextjs`. O build é feito automaticamente a partir da branch principal.

```toml
# netlify.toml
[build]
  command = "corepack pnpm build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

## 🎨 Temas

A aplicação suporta temas **claro** e **escuro** via `next-themes`, com detecção automática da preferência do sistema operacional.

---

## 📄 Licença

Este projeto é de uso interno da **Secretaria de Ciência, Tecnologia e Inovação do Estado da Bahia (SECTI)**.

---

**Desenvolvido para a SECTI-BA** 🏛️