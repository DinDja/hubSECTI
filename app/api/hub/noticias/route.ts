import { NextResponse } from "next/server"

const NEWS_LIST_URL = "https://www.ba.gov.br/secti/noticias?page=0"
const DEFAULT_SOURCE = "Portal SECTI"
const DEFAULT_SITE_NAME = "SECTI - Secretaria de Ciencia, Tecnologia e Inovacao"
const DEFAULT_IMAGE =
  "https://www.ba.gov.br/secti/modules/custom/bagov_base_blocks/assets/images/logo-governo-rodape.png"
const UPSTREAM_HEADERS = {
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
} as const

export const dynamic = "force-dynamic"
export const revalidate = 0

type NewsItem = {
  date: string
  title: string
  description: string
  href: string
  source: string
  preview: {
    url: string
    title: string
    description: string
    image: string
    siteName: string
  }
}

type MetaMap = Record<string, string>

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function decodeHtmlEntities(value: string) {
  const replacements: Array<[string, string]> = [
    ["&amp;", "&"],
    ["&quot;", '"'],
    ["&#039;", "'"],
    ["&apos;", "'"],
    ["&lt;", "<"],
    ["&gt;", ">"],
    ["&nbsp;", " "],
  ]

  let decoded = value

  decoded = decoded.replace(/&#(\d+);/g, (_, digits: string) => {
    const code = Number.parseInt(digits, 10)
    return Number.isNaN(code) ? "" : String.fromCharCode(code)
  })

  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
    const code = Number.parseInt(hex, 16)
    return Number.isNaN(code) ? "" : String.fromCharCode(code)
  })

  for (const [entity, char] of replacements) {
    decoded = decoded.replaceAll(entity, char)
  }

  return normalizeWhitespace(decoded)
}

function extractAttr(tag: string, attr: string) {
  const regex = new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "i")
  const match = tag.match(regex)
  return match?.[1] ?? null
}

function parseMetaTags(html: string): MetaMap {
  const tags = html.match(/<meta\s+[^>]*>/gi) ?? []
  const meta: MetaMap = {}

  for (const tag of tags) {
    const key = extractAttr(tag, "property") ?? extractAttr(tag, "name")
    const content = extractAttr(tag, "content")

    if (!key || !content) {
      continue
    }

    meta[key.toLowerCase()] = decodeHtmlEntities(content)
  }

  return meta
}

function normalizeAbsoluteHttpsUrl(rawUrl: string | null | undefined, baseUrl?: string) {
  if (!rawUrl) {
    return null
  }

  const trimmed = normalizeWhitespace(rawUrl)
  if (!trimmed) {
    return null
  }

  let candidate = trimmed

  if (candidate.startsWith("//")) {
    candidate = `https:${candidate}`
  }

  try {
    const parsed = new URL(candidate, baseUrl)

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null
    }

    parsed.protocol = "https:"
    return parsed.toString()
  } catch {
    return null
  }
}

function toShortDate(rawDate: string | null, fallbackUrl: string) {
  if (rawDate) {
    const match = rawDate.match(/(\d{2})\/(\d{2})\/(\d{4})/)
    if (match) {
      const day = Number.parseInt(match[1], 10)
      const month = Number.parseInt(match[2], 10)
      const year = Number.parseInt(match[3], 10)

      const date = new Date(Date.UTC(year, month - 1, day))
      const monthShort = new Intl.DateTimeFormat("pt-BR", {
        month: "short",
        timeZone: "UTC",
      })
        .format(date)
        .replace(".", "")
        .toLowerCase()

      return `${String(day).padStart(2, "0")} ${monthShort} ${year}`
    }
  }

  const fallbackMatch = fallbackUrl.match(/\/noticias\/(\d{4})-(\d{2})\//)
  if (fallbackMatch) {
    const year = Number.parseInt(fallbackMatch[1], 10)
    const month = Number.parseInt(fallbackMatch[2], 10)

    const date = new Date(Date.UTC(year, month - 1, 1))
    const monthShort = new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      timeZone: "UTC",
    })
      .format(date)
      .replace(".", "")
      .toLowerCase()

    return `${monthShort} ${year}`
  }

  return "Data nao informada"
}

function extractPublicationDate(html: string) {
  const strictMatch = html.match(
    /field--name-field-date-created[\s\S]*?<b>\s*(\d{2}\/\d{2}\/\d{4})\s*<\/b>/i,
  )
  if (strictMatch?.[1]) {
    return strictMatch[1]
  }

  const fallbackMatch = html.match(/(\d{2}\/\d{2}\/\d{4})/)
  return fallbackMatch?.[1] ?? null
}

function extractNewsLinks(html: string) {
  const matches = html.matchAll(
    /https?:\/\/www\.ba\.gov\.br\/secti\/noticias\/\d{4}-\d{2}\/\d+\/[^"'\s<]+/gi,
  )

  const links: string[] = []
  const seen = new Set<string>()

  for (const match of matches) {
    const raw = match[0]
    const normalized = raw.replace(/^http:\/\//i, "https://")

    if (seen.has(normalized)) {
      continue
    }

    seen.add(normalized)
    links.push(normalized)
  }

  return links
}

function isLikelyDecorativeImage(url: string) {
  const normalized = url.toLowerCase()

  return (
    normalized.includes("logo-governo-rodape") ||
    normalized.includes("access_icon") ||
    normalized.includes("access_popup") ||
    normalized.includes("vlibras")
  )
}

function extractContentImage(html: string, baseUrl: string) {
  const imgTags = html.match(/<img\s+[^>]*>/gi) ?? []

  for (const tag of imgTags) {
    const src = extractAttr(tag, "src")
    const normalized = normalizeAbsoluteHttpsUrl(src, baseUrl)

    if (!normalized || isLikelyDecorativeImage(normalized)) {
      continue
    }

    return normalized
  }

  return null
}

async function buildNewsItem(link: string): Promise<NewsItem | null> {
  const upstream = await fetch(link, {
    cache: "no-store",
    headers: UPSTREAM_HEADERS,
  })

  if (!upstream.ok) {
    return null
  }

  const html = await upstream.text()
  const meta = parseMetaTags(html)
  const publicationDate = extractPublicationDate(html)

  const href = normalizeAbsoluteHttpsUrl(meta["og:url"], link) ?? normalizeAbsoluteHttpsUrl(link) ?? link
  const title = meta["og:title"] ?? "Noticia institucional da SECTI"
  const description =
    meta["og:description"] ?? "Clique para abrir a materia completa no portal institucional da SECTI."
  const primaryMetaImage = normalizeAbsoluteHttpsUrl(
    meta["og:image:secure_url"] ?? meta["og:image"] ?? meta["twitter:image"],
    href,
  )
  const contentImage = extractContentImage(html, href)
  const image =
    (primaryMetaImage && !isLikelyDecorativeImage(primaryMetaImage)
      ? primaryMetaImage
      : contentImage) ?? DEFAULT_IMAGE

  return {
    date: toShortDate(publicationDate, href),
    title,
    description,
    href,
    source: DEFAULT_SOURCE,
    preview: {
      url: href,
      title,
      description,
      image,
      siteName: meta["og:site_name"] ?? DEFAULT_SITE_NAME,
    },
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const limitParam = Number.parseInt(requestUrl.searchParams.get("limit") ?? "6", 10)
  const limit = Number.isNaN(limitParam) ? 6 : Math.max(1, Math.min(18, limitParam))

  try {
    const listResponse = await fetch(NEWS_LIST_URL, {
      cache: "no-store",
      headers: UPSTREAM_HEADERS,
    })

    const listHtml = await listResponse.text()

    if (!listResponse.ok) {
      return NextResponse.json(
        {
          error: "Falha ao buscar a listagem de noticias do portal institucional.",
          status: listResponse.status,
          details: listHtml.slice(0, 300),
        },
        { status: 502 },
      )
    }

    const links = extractNewsLinks(listHtml)
    if (links.length === 0) {
      return NextResponse.json(
        {
          error: "Nao foi possivel extrair noticias da listagem institucional.",
        },
        { status: 502 },
      )
    }

    const items: NewsItem[] = []
    const seenHrefs = new Set<string>()

    for (const link of links) {
      if (items.length >= limit) {
        break
      }

      try {
        const item = await buildNewsItem(link)
        if (item && !seenHrefs.has(item.href)) {
          seenHrefs.add(item.href)
          items.push(item)
        }
      } catch {
        continue
      }
    }

    if (items.length === 0) {
      return NextResponse.json(
        {
          error: "Nao foi possivel carregar os detalhes das noticias institucionais.",
        },
        { status: 502 },
      )
    }

    return NextResponse.json(
      {
        source: DEFAULT_SOURCE,
        fetchedAt: new Date().toISOString(),
        items,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "X-Hub-Source": "SECTI_NOTICIAS",
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"

    return NextResponse.json(
      {
        error: "Erro ao conectar com o portal institucional de noticias.",
        details: message,
      },
      { status: 502 },
    )
  }
}