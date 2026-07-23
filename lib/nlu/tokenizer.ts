const ACCENT_MAP: Record<string, string> = {
  à: "a", á: "a", â: "a", ã: "a", ä: "a",
  ç: "c",
  è: "e", é: "e", ê: "e", ë: "e",
  ì: "i", í: "i", î: "i", ï: "i",
  ñ: "n",
  ò: "o", ó: "o", ô: "o", õ: "o", ö: "o",
  ù: "u", ú: "u", û: "u", ü: "u",
  ý: "y", ÿ: "y",
}

export function normalize(text: string): string {
  let out = text.toLowerCase()
  out = out.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  out = out.replace(/[àáâãäçèéêëìíîïñòóôõöùúûüýÿ]/gi, (c) => ACCENT_MAP[c] ?? c)
  out = out.replace(/[^a-z0-9\s]/g, " ")
  out = out.replace(/\s+/g, " ").trim()
  return out
}

export function tokenize(text: string, minLen = 2): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length >= minLen)
}

export function ngrams(tokens: string[], n: number): string[] {
  if (n < 2 || tokens.length < n) return []
  const out: string[] = []
  for (let i = 0; i <= tokens.length - n; i++) {
    out.push(tokens.slice(i, i + n).join(" "))
  }
  return out
}

export function allGrams(text: string): string[] {
  const tokens = tokenize(text)
  return [...tokens, ...ngrams(tokens, 2), ...ngrams(tokens, 3)]
}
