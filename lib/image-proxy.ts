function toHexByte(value: number) {
  return value.toString(16).padStart(2, "0")
}

export function encodeUrlForProxyPath(rawUrl: string) {
  const bytes = new TextEncoder().encode(rawUrl)
  let encoded = ""

  for (const byte of bytes) {
    encoded += toHexByte(byte)
  }

  return encoded
}

export function decodeUrlFromProxyPath(encoded: string) {
  const trimmed = encoded.trim().toLowerCase()

  if (!trimmed || trimmed.length % 2 !== 0 || /[^0-9a-f]/.test(trimmed)) {
    return null
  }

  const bytes = new Uint8Array(trimmed.length / 2)

  for (let index = 0; index < trimmed.length; index += 2) {
    const byte = Number.parseInt(trimmed.slice(index, index + 2), 16)
    if (Number.isNaN(byte)) {
      return null
    }

    bytes[index / 2] = byte
  }

  try {
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

export function buildImageProxyPath(rawUrl: string) {
  return `/api/hub/image-proxy/${encodeUrlForProxyPath(rawUrl)}`
}