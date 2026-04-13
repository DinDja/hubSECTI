import { NextResponse } from "next/server"

const MAX_TARGET_LENGTH = 2048
const ALLOWED_HOSTS = new Set(["www.ba.gov.br", "ba.gov.br", "images.unsplash.com"])
const UPSTREAM_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

export const dynamic = "force-dynamic"
export const revalidate = 0

function normalizeTargetUrl(rawUrl: string | null) {
  if (!rawUrl) {
    return null
  }

  const trimmed = rawUrl.trim()
  if (!trimmed || trimmed.length > MAX_TARGET_LENGTH) {
    return null
  }

  let candidate = trimmed

  if (candidate.startsWith("//")) {
    candidate = `https:${candidate}`
  }

  try {
    const parsed = new URL(candidate)

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null
    }

    parsed.protocol = "https:"
    return parsed
  } catch {
    return null
  }
}

function isAllowedHost(hostname: string) {
  if (ALLOWED_HOSTS.has(hostname)) {
    return true
  }

  return hostname.endsWith(".ba.gov.br")
}

function resolveContentType(upstreamType: string | null, pathname: string) {
  const cleanType = upstreamType?.split(";")[0].trim().toLowerCase() ?? ""
  if (cleanType.startsWith("image/")) {
    return cleanType
  }

  if (/\.png$/i.test(pathname)) return "image/png"
  if (/\.webp$/i.test(pathname)) return "image/webp"
  if (/\.gif$/i.test(pathname)) return "image/gif"
  if (/\.avif$/i.test(pathname)) return "image/avif"
  if (/\.svg$/i.test(pathname)) return "image/svg+xml"
  return "image/jpeg"
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const target = normalizeTargetUrl(requestUrl.searchParams.get("url"))

  if (!target) {
    return NextResponse.json({ error: "Parametro url invalido." }, { status: 400 })
  }

  if (!isAllowedHost(target.hostname)) {
    return NextResponse.json({ error: "Host de imagem nao permitido." }, { status: 403 })
  }

  try {
    const upstream = await fetch(target.toString(), {
      cache: "no-store",
      redirect: "follow",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "User-Agent": UPSTREAM_USER_AGENT,
        Referer: "https://www.ba.gov.br/",
      },
    })

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: "Falha ao buscar imagem remota.", status: upstream.status },
        { status: 502 },
      )
    }

    const contentType = resolveContentType(upstream.headers.get("content-type"), target.pathname)

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Netlify-CDN-Cache-Control": "no-store",
        Vary: "Accept, Accept-Encoding",
        "X-Hub-Image-Proxy": "1",
        "X-Hub-Image-Host": target.hostname,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"

    return NextResponse.json(
      {
        error: "Erro ao carregar imagem remota.",
        details: message,
      },
      { status: 502 },
    )
  }
}
