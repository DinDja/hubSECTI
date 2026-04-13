import { proxyImageFromRawUrl } from "./proxy-core"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  return proxyImageFromRawUrl(requestUrl.searchParams.get("url"))
}
