import { Handler } from "@netlify/functions"

const SHEET_ID = "1OzSpSHIXIURRTl7NLlBfAYJJM1y4vv7KVgVRjqRdXVE"
const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || ""

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" }
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    }
  }

  try {
    const { ip, path, userAgent, timestamp } = JSON.parse(event.body || "{}")

    const clientIp =
      ip ||
      event.headers["x-forwarded-for"]?.split(",")[0] ||
      event.headers["x-nf-client-connection-ip"] ||
      "Desconhecido"

    const accessTime = timestamp || new Date().toISOString()
    const userPath = path || event.path || "Desconhecido"
    const ua = userAgent || event.headers["user-agent"] || "Desconhecido"

    const payload = {
      timestamp: accessTime,
      ip: clientIp,
      path: userPath,
      userAgent: ua,
    }

    if (GOOGLE_APPS_SCRIPT_URL) {
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
    } else {
      console.log("Log access (no GAS URL configured):", payload)
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        logged: payload,
      }),
    }
  } catch (error) {
    console.error("Error logging access:", error)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Failed to log access", details: String(error) }),
    }
  }
}