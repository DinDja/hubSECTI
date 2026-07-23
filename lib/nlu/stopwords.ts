export const STOPWORDS_PT = new Set([
  "a", "ao", "aos", "aquela", "aquele", "aqueles", "aquelas", "aquilo", "as", "ate", "ate",
  "com", "como", "da", "das", "de", "dela", "delas", "dele", "deles", "depois", "do", "dos",
  "e", "ela", "elas", "ele", "eles", "em", "entre", "era", "eram", "essa", "esse", "esses",
  "essas", "esta", "estamos", "estao", "estas", "estava", "estavam", "este", "estes", "isto",
  "isso", "ja", "la", "lhe", "lhes", "lo", "mais", "mas", "me", "mesma", "mesmo", "meu",
  "meus", "minha", "minhas", "muito", "muitos", "na", "nao", "nas", "ne", "nem", "no", "nos",
  "nossa", "nossas", "nosso", "nossos", "numa", "num", "numas", "nuns", "o", "os", "ou",
  "para", "pela", "pelas", "pelo", "pelos", "por", "qual", "quando", "que", "quem", "sao",
  "se", "seja", "sejam", "sem", "seu", "seus", "sua", "suas", "sobre", "tambem", "te", "tem",
  "temos", "tenho", "ter", "teu", "teus", "tinha", "tinham", "tua", "tuas", "um", "uma",
  "umas", "uns", "vai", "vem", "voce", "voces", "toda", "todas", "todo", "todos", "aqui",
  "ali", "houver", "havera", "havia", "para", "so", "pra", "pro", "agora", "ja", "ainda",
])

export function removeStopwords(tokens: string[]): string[] {
  return tokens.filter((t) => !STOPWORDS_PT.has(t))
}
