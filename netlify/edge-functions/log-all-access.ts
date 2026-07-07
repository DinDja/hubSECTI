export const config = {
  path: "/*",
}

export default async function requestHandler(request: Request) {
  const url = new URL(request.url)
  
  if (url.pathname.startsWith("/.netlify/functions/")) {
    return fetch(request)
  }

  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-nf-client-connection-ip") ||
    "unknown"

  const logData = {
    ip: clientIp,
    path: url.pathname,
    userAgent: request.headers.get("user-agent") || "unknown",
    timestamp: new Date().toISOString(),
  }

  try {
    await fetch("/.netlify/functions/log-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logData),
    })
  } catch (error) {
    console.error("Failed to log access:", error)
  }

  return fetch(request)
}