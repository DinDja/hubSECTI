const PUBLIC_FIELDS = [
  'titulo', 'natureza', 'status', 'estadoAtual', 'instituicao',
  'unidade', 'responsavel', 'parceiros', 'periodo', 'estado',
  'territorio', 'municipio', 'beneficiarios', 'nmrBeneficiarios',
  'investimentoReal', 'paoe', 'fonteFinanciamento', 'localExecucao',
  'metaFisica', 'execucaoFisica', 'execucaoFinanceira',
  'objetivoGeral', 'objetivosEspecificos', 'updatedAt',
  'fotos', 'contexto', 'problemaDemanda', 'justificativa',
  'sustentabilidade', 'riscos', 'pendencias', 'observacoes',
  'recursosHumanos', 'recursosMateriais',
  'indicadoresProcesso', 'indicadoresResultado',
  'numeroProcessoSEI', 'seiNaoSeAplica', 'listaInstrumentos',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
};

let _accessToken = null;
let _tokenExpiry = 0;

function base64UrlEncode(str) {
  return btoa(str)
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

function pemToBinary(pem) {
  const b64 = pem
    .replace(/-----BEGIN [A-Z\s]+-----/g, '')
    .replace(/-----END [A-Z\s]+-----/g, '')
    .replace(/\s/g, '');
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function getAccessToken(serviceAccount) {
  if (_accessToken && Date.now() < _tokenExpiry) {
    return _accessToken;
  }

  const { client_email, private_key } = serviceAccount;
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: client_email,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const message = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBinary(private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    new TextEncoder().encode(message)
  );

  const sigB64 = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );
  const jwt = `${message}.${sigB64}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await resp.json();
  _accessToken = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000 - 60000;
  return _accessToken;
}

function convertFirestoreValue(value) {
  if (!value) return null;
  const type = Object.keys(value)[0];
  const raw = value[type];

  switch (type) {
    case 'stringValue':
      return raw;
    case 'integerValue':
      return parseInt(raw, 10);
    case 'doubleValue':
      return parseFloat(raw);
    case 'booleanValue':
      return raw;
    case 'timestampValue':
      return raw;
    case 'arrayValue':
      return (raw.values || []).map(convertFirestoreValue);
    case 'mapValue':
      return raw.fields
        ? Object.fromEntries(
            Object.entries(raw.fields).map(([k, v]) => [k, convertFirestoreValue(v)])
          )
        : {};
    default:
      return raw;
  }
}

async function getProjects(accessToken, projectId) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/projects`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Firestore error ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  const docs = data.documents || [];

  return docs.map((doc) => {
    const fields = doc.fields || {};
    const out = { id: doc.name.split('/').pop() };

    for (const field of PUBLIC_FIELDS) {
      if (fields[field]) {
        out[field] = convertFirestoreValue(fields[field]);
      }
    }

    return out;
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
      return jsonResponse(405, { error: 'Método não permitido. Use GET.' });
    }

    try {
      const raw = env.FIREBASE_SERVICE_ACCOUNT;
      if (!raw) {
        throw new Error('Env var FIREBASE_SERVICE_ACCOUNT ausente.');
      }

      const serviceAccount = JSON.parse(raw);
      const token = await getAccessToken(serviceAccount);
      const projetos = await getProjects(token, serviceAccount.project_id);

      return jsonResponse(200, { total: projetos.length, projetos });
    } catch (error) {
      console.error('[projetos-secti] Erro:', error);
      return jsonResponse(500, {
        error: 'Erro ao buscar projetos do SECTI.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  },
};

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}
