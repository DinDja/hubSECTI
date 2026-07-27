import { parseSpreadsheet } from './sharepoint-processor.js';

const DOWNLOAD_URL =
  'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/valmir_ferreira_secti_ba_gov_br/IQDZbNB-DvGJTIGRveSkOzDZATYdKyDyClL0S6SsWABR4bw?rtime=jjUJQOzr3kg';

const KV_KEY = 'sharepoint-data';
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
  const cookieJar = [];

  function getCookieHeader() {
    return cookieJar.map((c) => c.split(';')[0]).join('; ');
  }

  function extractCookies(resp) {
    const setCookie = resp.headers.get('set-cookie');
    if (setCookie) {
      const parts = setCookie.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed && !cookieJar.some((c) => c.startsWith(trimmed.split(';')[0].split('=')[0] + '='))) {
          cookieJar.push(trimmed);
        }
      }
    }
  }

  async function request(currentUrl) {
    const resp = await fetch(currentUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        Cookie: getCookieHeader(),
      },
      redirect: 'manual',
    });

    extractCookies(resp);

    const status = resp.status;
    const contentType = resp.headers.get('content-type') || '';

    if ([301, 302, 303, 307, 308].includes(status)) {
      const location = resp.headers.get('location');
      if (!location) throw new Error('Redirect sem Location');
      const nextUrl = location.startsWith('http')
        ? location
        : `https://prodeboffice365-my.sharepoint.com${location}`;
      return request(nextUrl);
    }

    if (status !== 200) throw new Error(`SharePoint retornou HTTP ${status}`);

    const buffer = await resp.arrayBuffer();

    const bytes = new Uint8Array(buffer);
    if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
      return buffer;
    }

    if (contentType.includes('text/html')) {
      const html = new TextDecoder().decode(buffer);
      const redirectUrl = extractRedirectUrl(html);
      if (redirectUrl) {
        return request(redirectUrl);
      }
      throw new Error(
        `SharePoint retornou HTML sem redirect: ${html.substring(0, 500)}`
      );
    }

    throw new Error(`Conteúdo inesperado: ${contentType}`);
  }

  return request(url);
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

async function serveFromKv(kv, allowStale = false) {
  const blob = await kv.get(KV_KEY, 'json');
  if (blob?.jsonString && blob?.timestamp) {
    const ageMs = Date.now() - blob.timestamp;
    if (ageMs < KV_MAX_AGE) {
      return { data: blob, ageSec: Math.round(ageMs / 1000), stale: false };
    }
    if (allowStale) {
      return { data: blob, ageSec: Math.round(ageMs / 1000), stale: true };
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
      const cached = await serveFromKv(env.SHAREPOINT_CACHE);
      if (cached) {
        return buildResponse(cached.data.jsonString, 200, {
          'X-Content-Source': 'kv',
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

      const stale = await serveFromKv(env.SHAREPOINT_CACHE, true);
      if (stale) {
        return buildResponse(stale.data.jsonString, 200, {
          'X-Content-Source': 'kv-stale',
          'X-Cache-Age': String(stale.ageSec),
          'X-Geracao': String(stale.data.timestamp),
          'X-Stale-Warning': 'dados podem estar desatualizados',
        });
      }

      return buildResponse('{}', 200, {
        'X-Content-Source': 'empty-fallback',
        'X-Cache-Status': 'no-data',
        'X-Error-Detail': error.message.substring(0, 500),
      });
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
      console.error('[Refresh] Erro na atualização:', err.message);
    }
  },
};
