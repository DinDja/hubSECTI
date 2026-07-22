# Netlify Functions — HUB SECTI

Pasta `functions/` com as Netlify Functions do HUB SECTI.

## `projetos-secti.js`

Retorna metadados públicos dos projetos do sistema SECTI (Firestore), usando a
conta de serviço do Firebase para bypass das regras client (App Check).

- **Coleção lida:** `projects`
- **Campos retornados:** apenas metadados de apresentação (whitelist). Dados
  sensíveis (userId, editorUids, editorEmails, owners, numeroProcessoSEI,
  fotos, documentos, observações internas) são omitidos.
- **Endpoint:** `/.netlify/functions/projetos-secti`
- **Proxy pelo Hub:** `/api/hub/projetos` (rota Next em `app/api/hub/projetos/route.ts`)

### Variável de ambiente (obrigatória)

No Netlify (Site settings → Environment variables), defina:

```
FIREBASE_SERVICE_ACCOUNT = <conteúdo completo do JSON da conta de serviço>
```

O JSON é o arquivo baixado do Firebase Console (
`secti-551ad-firebase-adminsdk-fbsvc-*.json`). Cole o conteúdo inteiro,
incluindo as chaves `private_key`, `project_id`, `client_email`, etc.

> O `private_key` contém `\n` literais — mantenha exatamente como está no
> arquivo. O `firebase-admin` aceita essa forma.

### Instalação de dependências

As dependências (`firebase-admin`) ficam em `functions/package.json` e são
instaladas automaticamente pelo Netlify no build (bundler `esbuild`).

Para desenvolver localmente:

```bash
cd functions
npm install
```

### Rodar local

```bash
netlify dev
# função em http://localhost:8888/.netlify/functions/projetos-secti
# proxy pelo Hub em http://localhost:3000/api/hub/projetos
```
