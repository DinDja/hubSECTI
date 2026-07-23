export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const dp = new Uint16Array(n + 1)
  for (let j = 0; j <= n; j++) dp[j] = j

  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
      prev = tmp
    }
  }

  return dp[n]
}

export function similarity(a: string, b: string): number {
  if (a === b) return 1
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  const dist = levenshtein(a, b)
  return 1 - dist / maxLen
}

export function fuzzyContains(text: string, target: string, threshold = 0.8): boolean {
  if (text.includes(target)) return true
  if (target.length < 4) return false
  return similarity(text, target) >= threshold
}

export function bestFuzzyMatch(query: string, candidates: string[], threshold = 0.7): { match: string; score: number } | null {
  let best: { match: string; score: number } | null = null

  for (const c of candidates) {
    const score = similarity(query, c)
    if (score >= threshold && (!best || score > best.score)) {
      best = { match: c, score }
    }
  }

  return best
}
