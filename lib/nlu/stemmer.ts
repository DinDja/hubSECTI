const PLURAL_RULES: [RegExp, string][] = [
  [/^(.*)oes$/, "$1ao"],
  [/^(.*)aes$/, "$1a"],
  [/^(.*)aos$/, "$1ao"],
  [/^(.*)[aeiou]is$/, "$1l"],
  [/^(.*)eis$/, "$1ei"],
  [/^(.*)ns$/, "$1m"],
  [/^(.*)(s)$/, "$1"],
]

const FEM_RULES: [RegExp, string][] = [
  [/^(.*)nha$/, "$1nhao"],
  [/^(.*)ora$/, "$1or"],
  [/^(.*)ess?[oa]$/, "$1esso"],
  [/^(.*)triz$/, "$1tor"],
  [/^(.*)[ae]$/, ""],
  [/^(.*)a$/, "$1"],
]

const AUGM_DIM_RULES: [RegExp, string][] = [
  [/^(.*)aca[ao]$/, "$1aco"],
  [/^(.*)inh[ao]$/, "$1"],
  [/^(.*)([sz])inh[ao]$/, "$1$2inho"],
  [/^(.*)zinh[ao]$/, "$1z"],
  [/^(.*)([rs])zinh[ao]$/, "$1$2"],
  [/^(.*)([oa])zinh[ao]$/, "$1$2"],
  [/^(.*)z[aá]o$/, "$1"],
  [/^(.*)([sc])h[aá]o$/, "$1$2hao"],
]

const ADV_RULE: [RegExp, string] = [/^(.*)mente$/, "$1"]

const VOWEL_CLEAN: RegExp = /^([bcdfghjklmnpqrstvwxyz]*)([aeiou]+)(.*)$/

function applyRules(word: string, rules: [RegExp, string][]): string {
  for (const [pattern, replacement] of rules) {
    if (pattern.test(word)) return word.replace(pattern, replacement)
  }
  return word
}

export function stem(word: string): string {
  let w = word.toLowerCase().trim()
  if (w.length <= 3) return w

  w = applyRules(w, [ADV_RULE])
  w = applyRules(w, AUGM_DIM_RULES)
  w = applyRules(w, FEM_RULES)
  w = applyRules(w, PLURAL_RULES)

  if (w.length > 3 && VOWEL_CLEAN.test(w)) {
    w = w.replace(VOWEL_CLEAN, "$1$2")
  }

  return w
}

export function stemTokens(tokens: string[]): string[] {
  return tokens.map(stem)
}
