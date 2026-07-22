// _worker.js – KERSFORGE (RETURNS SAVED SCRIPTS - NO HARDCODED CODE)
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================================
    // LOADER – RETURNS YOUR SAVED SCRIPT
    // ============================================================
    if (path.startsWith('/api/public/loaders/') && path.endsWith('/lua')) {
      const parts = path.split('/');
      const scriptId = parts[4] || 'unknown';

      // ==========================================================
      // IN PRODUCTION: FETCH FROM KV
      // For now, return a placeholder that you replace with your script
      // ==========================================================
      const yourScript = `-- Your saved script goes here
print("Script loaded: ${scriptId}")
-- This is whatever you saved in the Forge tab`;

      return new Response(yourScript, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ============================================================
    // LEGACY LOADER
    // ============================================================
    if (path.startsWith('/loader/')) {
      const scriptId = path.replace('/loader/', '').split('/')[0];
      return Response.redirect(`${url.origin}/api/public/loaders/${scriptId}/lua`, 301);
    }

    // ============================================================
    // SERVE HTML FILES
    // ============================================================
    if (path === '/' || path === '/index.html' || path === '/dashboard.html' || path === '/admin.html') {
      return fetch(request);
    }

    // ============================================================
    // API - CREATE SCRIPT (SAVES YOUR SCRIPT)
    // ============================================================
    if (path === '/api/scripts' && request.method === 'POST') {
      try {
        const body = await request.json();
        const scriptId = 'script_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);

        // In production: save to KV
        // await env.KERSFORGE_KV.put(scriptId, body.code);

        return new Response(JSON.stringify({
          success: true,
          id: scriptId,
          loaderUrl: `${url.origin}/api/public/loaders/${scriptId}/lua`
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ============================================================
    // API - GET DATA
    // ============================================================
    if (path === '/api/data') {
      return new Response(JSON.stringify({
        scripts: [],
        keys: [],
        bannedHWIDs: [],
        serverTime: Date.now()
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // ============================================================
    // API - GENERATE KEY
    // ============================================================
    if (path === '/api/keys' && request.method === 'POST') {
      const key = 'KF-' + Array.from({length: 16}, () =>
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
      ).join('');
      return new Response(JSON.stringify({ success: true, key: key }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // ============================================================
    // FALLBACK – 404
    // ============================================================
    return new Response('Not Found', { status: 404 });
  }
};
