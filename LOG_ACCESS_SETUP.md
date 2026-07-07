# Como Configurar o Log de Acessos no Google Sheets

## Visão Geral

O sistema registra automaticamente todos os acessos às APIs do HUB em uma planilha do Google Sheets com:
- Data e hora do acesso
- IP do usuário
- Endpoint acessado
- User agent (navegador/dispositivo)

## Configuração Necessária

### Opção 1: Google Apps Script (Recomendado para planilha "editor livre")

1. **Acesse sua planilha**: https://docs.google.com/spreadsheets/d/1OzSpSHIXIURRTl7NLlBfAYJJM1y4vv7KVgVRjqRdXVE/edit

2. **Crie os cabeçalhos** na primeira linha:
   - A1: `Data`
   - B1: `Hora`
   - C1: `IP`
   - D1: `Endpoint`
   - E1: `User Agent`

3. **Extensões** → **Apps Script**

4. **Cole o seguinte código**:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  var date = new Date(data.timestamp);
  var formattedDate = Utilities.formatDate(date, "America/Sao_Paulo", "dd/MM/yyyy");
  var formattedTime = Utilities.formatDate(date, "America/Sao_Paulo", "HH:mm:ss");
  
  sheet.appendRow([
    formattedDate,
    formattedTime,
    data.ip,
    data.path,
    data.userAgent
  ]);
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

5. **Implantar** → **Nova implantação** → **Tipo: App da Web**

6. **Configurar**:
   - Descrição: "Log Access API"
   - Executar como: `Eu`
   - Quem pode acessar: `Qualquer pessoa`

7. **Copie a URL do app da web** e atualize a função `log-access.ts` com a URL correta

### Opção 2: API do Google Sheets (Oficial)

1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com/)

2. Ative a **Google Sheets API**

3. Crie credenciais (Service Account)

4. Compartilhe a planilha com o email da service account

5. Gere um access token e adicione no `.env.local`:
   ```
   GOOGLE_SHEETS_ACCESS_TOKEN=your_token_here
   ```

## Como Funciona

### Backend (Netlify Function)

A função `netlify/functions/log-access.ts`:
- Recebe os dados de acesso via POST
- Extrai IP, path, user agent e timestamp
- Formata data/hora para padrão brasileiro
- Envia para a planilha do Google

### Frontend (Hook React)

O hook `hooks/use-log-access.ts`:
- Pode ser usado em componentes para logar acessos
- Exemplo de uso:
  ```tsx
  import { useLogAccess } from "@/hooks/use-log-access"
  
  export function MyComponent() {
    useLogAccess("/pagina-especifica")
    return <div>...</div>
  }
  ```

### APIs do HUB

As rotas já estão configuradas para log automaticamente:
- `/api/hub/conecta`
- `/api/hub/territorios`
- `/api/hub/noticias`

Cada uma chama a função de log automaticamente no início da requisição.

## Testando

1. **Deploy na Netlify**:
   ```bash
   git push
   # A Netlify vai fazer deploy automático
   ```

2. **Teste localmente** (precisa do Netlify CLI):
   ```bash
   netlify dev
   ```

3. **Acesse as APIs** e verifique os dados na planilha:
   - http://localhost:8888/api/hub/conecta
   - http://localhost:8888/api/hub/territorios
   - http://localhost:8888/api/hub/noticias

## Estrutura de Arquivos

```
netlify/
  functions/
    log-access.ts          # Função que salva na planilha
  edge-functions/
    log-all-access.ts      # (Opcional) Loga TODAS as requisições

app/api/hub/
  conecta/route.ts         # Com log automático
  territorios/route.ts     # Com log automático
  noticias/route.ts        # Com log automático

hooks/
  use-log-access.ts        # Hook para usar no frontend
```

## Personalização

### Adicionar log em outras APIs

Adicione no início da função GET/POST:

```typescript
async function logAccess(ip: string, path: string, userAgent: string) {
  try {
    await fetch("/.netlify/functions/log-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ip,
        path,
        userAgent,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    })
  } catch (error) {
    console.error("Failed to log access:", error)
  }
}

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"
  
  await logAccess(ip, "/sua-api-aqui", userAgent)
  // ... resto do código
}
```

### Edge Function (Log Global)

A edge function `log-all-access.ts` pode ser ativada para logar **todas** as requisições do site, não apenas as APIs. Para usar:

1. Descomente/configure no `netlify.toml`
2. Ajuste a lógica para não logar requests estáticos

## Privacidade e LGPD

⚠️ **Importante**: Você está coletando IPs de usuários, o que é considerado dado pessoal pela LGPD.

- Adicione um aviso de privacidade no site
- Considere anonimizar os IPs (ex: `192.168.1.xxx`)
- Defina um período de retenção dos dados