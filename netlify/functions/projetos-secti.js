/**
 * Netlify Function: projetos-secti
 *
 * Retorna metadados públicos dos projetos do sistema SECTI (Firestore).
 * Usa a conta de serviço do Firebase (env var FIREBASE_SERVICE_ACCOUNT)
 * para bypass das regras client (App Check) e listar todos os projetos.
 *
 * Responde em: /.netlify/functions/projetos-secti
 * Proxy pelo Hub: /api/hub/projetos
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// ---------- Whitelist de campos públicos ----------
// Apenas metadados de apresentação. Omitimos dados sensíveis:
// userId, editorUids, editorEmails, owners, numeroProcessoSEI,
// fotos, documentos, contexto interno, observações privadas.
const PUBLIC_FIELDS = [
  'titulo',
  'natureza',
  'status',
  'estadoAtual',
  'instituicao',
  'unidade',
  'responsavel',
  'parceiros',
  'periodo',
  'estado',
  'territorio',
  'municipio',
  'beneficiarios',
  'nmrBeneficiarios',
  'investimentoReal',
  'paoe',
  'fonteFinanciamento',
  'localExecucao',
  'metaFisica',
  'execucaoFisica',
  'execucaoFinanceira',
  'objetivoGeral',
  'objetivosEspecificos',
  'updatedAt',
];

// Firebase Admin singleton (evita re-init em invocações reutilizadas)
let _app = null;
let _db = null;

function getDb() {
  if (_db) return _db;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('Env var FIREBASE_SERVICE_ACCOUNT ausente.');
  }

  let serviceAccount;
  try {
    serviceAccount = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT inválido (JSON malformado).');
  }

  _app = initializeApp(
    {
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    },
    'secti-projects-reader'
  );
  _db = getFirestore(_app);
  return _db;
}

// Converte Timestamp do Firestore para ISO string (seguro p/ JSON)
function toIso(value) {
  if (!value) return null;
  if (value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

// Extrai apenas campos da whitelist, normalizando updatedAt
function mapPublicProject(docSnap) {
  const data = docSnap.data() || {};
  const out = { id: docSnap.id };

  for (const field of PUBLIC_FIELDS) {
    if (field === 'updatedAt') {
      out.updatedAt = toIso(data.updatedAt);
      continue;
    }
    if (data[field] !== undefined) {
      out[field] = data[field];
    }
  }

  return out;
}

// CORS headers (Hub consome do mesmo domínio, mas liberamos para dev)
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  // Pré-flight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Método não permitido. Use GET.' });
  }

  try {
    const db = getDb();
    const snap = await db.collection('projects').get();

    const projetos = snap.docs.map(mapPublicProject);

    return json(200, {
      total: projetos.length,
      projetos,
    });
  } catch (error) {
    console.error('[projetos-secti] Erro:', error);
    return json(500, {
      error: 'Erro ao buscar projetos do SECTI.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
