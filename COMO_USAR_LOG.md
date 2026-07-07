# 📝 Registro de Acessos no HUB via Google Sheets

## ✅ O que foi implementado

Sistema completo para registrar **IP, data/hora e endpoint** de todos que acessam o HUB, salvando automaticamente em uma planilha do Google Sheets.

---

## 📁 Arquivos Criados

```
✅ netlify/functions/log-access.ts       # Função Netlify que recebe os logs
✅ hooks/use-log-access.ts               # Hook React para usar no frontend
✅ google-apps-script.js                 # Script para colar na planilha
✅ .env.example                          # Exemplo de variáveis de ambiente
✅ LOG_ACCESS_SETUP.md                   # Documentação completa
```

---

## 🚀 Como Configurar (Passo a Passo)

### 1️⃣ Configurar a Planilha do Google

1. **Acesse**: https://docs.google.com/spreadsheets/d/1OzSpSHIXIURRTl7NLlBfAYJJM1y4vv7KVgVRjqRdXVE/edit

2. **Crie os cabeçalhos** na linha 1:
   ```
   A1: Data
   B1: Hora
   C1: IP
   D1: Endpoint
   E1: User Agent
   ```

3. **Extensões** → **Apps Script**

4. **Abra o arquivo** `google-apps-script.js` deste projeto

5. **Copie TODO o código** e cole no Apps Script da planilha

6. **Salve** (Ctrl+S ou ícone de disquete)

7. **Implantar** → **Nova implantação**
   - **Tipo**: App da Web
   - **Descrição**: HUB Access Logger
   - **Executar como**: Eu
   - **Quem pode acessar**: Qualquer pessoa
   - Clique em **Implantar**

8. **Copie a URL** gerada (ex: `https://script.google.com/macros/s/...../exec`)

---

### 2️⃣ Configurar Variável de Ambiente

**Opção A: Localmente** (`.env.local`):
```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_ID_AQUI/exec
```

**Opção B: Na Netlify** (Dashboard):
1. Site settings → Environment variables
2. Adicionar: `GOOGLE_APPS_SCRIPT_URL`
3. Valor: URL do Apps Script

---

### 3️⃣ Testar

**Localmente**:
```bash
netlify dev
```

Acesse:
- http://localhost:8888/api/hub/conecta
- http://localhost:8888/api/hub/territorios

**Verifique na planilha** se os dados foram registrados!

---

## 📊 O que será registrado

| Coluna | Exemplo |
|--------|---------|
| Data | 07/07/2026 |
| Hora | 14:35:22 |
| IP | 200.147.67.123 |
| Endpoint | /api/hub/conecta |
| User Agent | Mozilla/5.0 (Windows NT 10.0; Win64; x64)... |

---

## 🔧 APIs com Log Automático

Todas as rotas do HUB já estão configuradas:

- ✅ `/api/hub/conecta`
- ✅ `/api/hub/territorios`
- ✅ `/api/hub/noticias`

Sempre que alguém acessar esses endpoints, o log será registrado automaticamente.

---

## 🎯 Como Usar em Outras Rotas

Se criar uma nova API e quiser logar:

```typescript
// No início do arquivo
async function logAccess(ip: string, path: string, userAgent: string) {
  try {
    await fetch("/.netlify/functions/log-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, path, userAgent, timestamp: new Date().toISOString() }),
      keepalive: true,
    })
  } catch (error) {
    console.error("Failed to log access:", error)
  }
}

// Dentro do GET/POST
export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"
  
  await logAccess(ip, "/api/sua-rota", userAgent)
  
  // ... resto do código
}
```

---

## 🎨 Usar no Frontend (Opcional)

Para logar acesso a páginas/componentes:

```tsx
"use client"
import { useLogAccess } from "@/hooks/use-log-access"

export function HomePage() {
  useLogAccess("/pagina-inicial")
  
  return <div>...</div>
}
```

---

## ⚠️ LGPD - Importante

Você está coletendo **IPs de usuários**, que são dados pessoais!

**Recomendações**:
- [ ] Adicione aviso de cookies/privacidade no site
- [ ] Considere anonimizar IPs: `192.168.1.xxx`
- [ ] Defina política de retenção (ex: apagar após 90 dias)
- [ ] Use a função `cleanupOldLogs()` do Apps Script

---

## 🐛 Problemas Comuns

| Erro | Solução |
|------|---------|
| Logs não aparecem | Verifique se a URL do Apps Script está correta no `.env.local` |
| Erro 405 | A função só aceita POST |
| Erro de CORS | Verifique se o Apps Script está como "Qualquer pessoa" |
| Dados duplicados | Verifique se não há múltiplas chamadas de log |

---

## 📞 Próximos Passos

1. ✅ Configurar Apps Script na planilha
2. ✅ Adicionar URL no `.env.local`
3. ✅ Testar localmente
4. ✅ Deploy na Netlify
5. ✅ Monitorar planilha

**Dúvidas?** Consulte `LOG_ACCESS_SETUP.md` para detalhes completos.