import { NextResponse } from "next/server"

function isFrameBlocked(headers: Headers): boolean {
  const xFrameOptions = headers.get("x-frame-options")
  if (xFrameOptions) {
    const normalized = xFrameOptions.trim().toLowerCase()
    return normalized === "deny" || normalized === "sameorigin"
  }

  const csp = headers.get("content-security-policy")
  if (csp) {
    const directive = csp
      .split(";")
      .map((chunk) => chunk.trim())
      .find((chunk) => chunk.startsWith("frame-ancestors"))

    if (directive) {
      const rule = directive.replace("frame-ancestors", "").trim().toLowerCase()
      if (rule === "'none'" || rule === 'none') {
        return true
      }
      if (rule.includes("'self'") || rule.includes("self")) {
        return true
      }
      if (rule.includes("*") || rule.includes("https:") || rule.includes("http:")) {
        return false
      }
      return true
    }
  }

  return false
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url)
  const url = requestUrl.searchParams.get("url")
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  const probe = async (method: "HEAD" | "GET") => {
    try {
      return await fetch(parsedUrl.toString(), {
        method,
        redirect: "follow",
      })
    } catch {
      return null
    }
  }

  let response = await probe("HEAD")
  if (!response || response.status === 405 || response.status === 501) {
    response = await probe("GET")
  }

  if (!response) {
    return NextResponse.json(
      { allowed: false, reason: "fetch_failed" },
      { status: 502 }
    )
  }

  const blocked = isFrameBlocked(response.headers)
  return NextResponse.json({ allowed: !blocked })
}
