const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    try {
      const { ip, path, userAgent, timestamp } = await request.json();

      const clientIp =
        ip ||
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('cf-connecting-ip') ||
        'Desconhecido';

      const accessTime = timestamp || new Date().toISOString();
      const userPath = path || new URL(request.url).pathname || 'Desconhecido';
      const ua = userAgent || request.headers.get('user-agent') || 'Desconhecido';

      const payload = {
        timestamp: accessTime,
        ip: clientIp,
        path: userPath,
        userAgent: ua,
      };

      if (env.GOOGLE_APPS_SCRIPT_URL) {
        await fetch(env.GOOGLE_APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        console.log('Log access (no GAS URL configured):', payload);
      }

      return new Response(JSON.stringify({ success: true, logged: payload }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error logging access:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to log access', details: String(error) }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
