import { decodeUrlFromProxyPath } from "@/lib/image-proxy"

import { proxyImageFromRawUrl } from "../proxy-core"

export const dynamic = "force-dynamic"
export const revalidate = 0

type RouteContext = {
  params: Promise<{
    encoded: string
  }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { encoded } = await params
  const rawUrl = decodeUrlFromProxyPath(encoded)
  return proxyImageFromRawUrl(rawUrl)
}