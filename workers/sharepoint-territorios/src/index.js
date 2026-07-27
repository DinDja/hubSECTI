import { parseSpreadsheet } from './sharepoint-processor.js';

const DOWNLOAD_URL =
  'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/sdc_secti_ba_gov_br/IQCUmr5J0kxUQLKb9lRqZkT_AVOgJRieO_TN9lJiRxUzXI8?download=1';

const KV_KEY = 'conecta-data';
const KV_MAX_AGE = 90 * 60 * 1000;

function extractRedirectUrl(html) {
  const patterns = [
    /<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^;"]*;\s*url=([^"']+)["']/i,
    /window\.location\s*=\s*["']([^"']+)["']/i,
    /window\.location\.href\s*=\s*["']([^"']+)["']/i,
    /location\.replace\s*\(\s*["']([^"']+)["']\s*\)/i,
    /document\.location\s*=\s*["']([^"']+)["']/i,
    /document\.location\.href\s*=\s*["']([^"']+)["']/i,
    /(https:\/\/[^"'\s<>]+sharepoint[^"'\s<>]*download[^"'\s<>]*)/i,
    /(https:\/\/[^"'\s<>]+sharepoint\.com[^"'\s<>]+)/i,
    /url=([^"'\s&<>]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
  }
  return null;
}

async function downloadExcel(url) {
  let currentUrl = url;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    attempts++;

    const resp = await fetch(currentUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      redirect: 'manual',
    });

    const buffer = await resp.arrayBuffer();
    const contentType = resp.headers.get('content-type') || '';
    const status = resp.status;

    if ([301, 302, 303, 307, 308].includes(status)) {
      const location = resp.headers.get('location');
      if (location) {
        currentUrl = location.startsWith('http')
          ? location
          : `https://prodeboffice365-my.sharepoint.com${location}`;
        continue;
      }
    }

    if (status === 200) {
      const bytes = new Uint8Array(buffer);
      if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
        return buffer;
      }

      if (contentType.includes('text/html')) {
        const html = new TextDecoder().decode(buffer);
        const redirectUrl = extractRedirectUrl(html);
        if (redirectUrl) {
          currentUrl = redirectUrl.startsWith('http')
            ? redirectUrl
            : `https://prodeboffice365-my.sharepoint.com${redirectUrl}`;
          continue;
        }
        throw new Error(
          `SharePoint retornou HTML sem redirect: ${html.substring(0, 300)}`
        );
      }

      throw new Error(`Content-Type inesperado: ${contentType}`);
    }

    throw new Error(`SharePoint retornou HTTP ${status}`);
  }

  throw new Error(`Máximo de redirects (${maxAttempts}) atingido`);
}

async function processExcel(buffer) {
  const startParse = Date.now();
  const jsonData = parseSpreadsheet(buffer);
  const parseTime = Date.now() - startParse;
  const jsonString = JSON.stringify(jsonData);
  const etag = await cryptoDigest(jsonString);

  return { jsonData, jsonString, etag, parseTime };
}

async function cryptoDigest(str) {
  const hash = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(str)
  );
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function serveFromKv(kv, requestAcceptEncoding) {
  const blob = await kv.get(KV_KEY, 'json');
  if (blob?.jsonString && blob?.timestamp) {
    const ageMs = Date.now() - blob.timestamp;
    if (ageMs < KV_MAX_AGE) {
      return {
        data: blob,
        source: 'kv',
        ageSec: Math.round(ageMs / 1000),
      };
    }
  }
  return null;
}

async function saveToKv(kv, jsonString, etag) {
  await kv.put(
    KV_KEY,
    JSON.stringify({ jsonString, etag, timestamp: Date.now() }),
    { expirationTtl: KV_MAX_AGE / 1000 }
  );
}

function buildResponse(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      ...extraHeaders,
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const nocache = url.searchParams.get('nocache') === 'true';
    const acceptEncoding = request.headers.get('accept-encoding') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (request.method !== 'GET') {
      return buildResponse(
        JSON.stringify({ error: 'Método não permitido. Use GET.' }),
        405
      );
    }

    if (!nocache) {
      const cached = await serveFromKv(env.SHAREPOINT_CACHE, acceptEncoding);
      if (cached) {
        return buildResponse(cached.data.jsonString, 200, {
          'X-Content-Source': cached.source,
          'X-Cache-Age': String(cached.ageSec),
          'X-Geracao': String(cached.data.timestamp),
        });
      }
    }

    try {
      const buffer = await downloadExcel(DOWNLOAD_URL);
      const { jsonString, etag, parseTime } = await processExcel(buffer);

      ctx.waitUntil(saveToKv(env.SHAREPOINT_CACHE, jsonString, etag));

      return buildResponse(jsonString, 200, {
        'X-Content-Source': 'sharepoint-processed',
        'X-Parse-Time': String(parseTime),
        ETag: `"${etag}"`,
      });
    } catch (error) {
      console.error('[sharepoint] Erro:', error);
      return buildResponse(
        JSON.stringify({
          error: 'Erro ao buscar dados do SharePoint',
          details: error.message,
        }),
        502
      );
    }
  },

  async scheduled(event, env, ctx) {
    console.log('[Refresh] Iniciando atualização agendada do cache...');
    try {
      const buffer = await downloadExcel(DOWNLOAD_URL);
      const { jsonString, etag } = await processExcel(buffer);
      await saveToKv(env.SHAREPOINT_CACHE, jsonString, etag);
      console.log('[Refresh] Cache atualizado com sucesso');
    } catch (err) {
      console.error('[Refresh] Erro na atualização agendada:', err.message);
    }
  },
};
