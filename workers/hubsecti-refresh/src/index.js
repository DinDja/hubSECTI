const PAGES_URL = 'https://hubsecti.pages.dev/api/conecta-refresh';

export default {
  async scheduled(event, env, ctx) {
    console.log('[Cron] Iniciando refresh do cache Conecta...');
    try {
      const res = await fetch(PAGES_URL, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        console.log(`[Cron] Refresh concluído (HTTP ${res.status})`);
      } else {
        console.error(`[Cron] Refresh falhou (HTTP ${res.status})`);
      }
    } catch (err) {
      console.error('[Cron] Erro no refresh:', err.message);
    }
  },
};
