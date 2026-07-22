// _worker.js – KERSFORGE v2 (Returns ONLY Your Script)
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const withCors = (response) => {
      Object.entries(corsHeaders).forEach(([k, v]) => {
        response.headers.set(k, v);
      });
      return response;
    };

    // ============================================================
    // LOADER – RETURNS YOUR SCRIPT ONLY
    // ============================================================
    if (path.startsWith('/api/public/loaders/') && path.endsWith('/lua')) {
      const parts = path.split('/');
      const scriptId = parts[4] || 'unknown';

      // ==========================================================
      // YOUR SCRIPT GOES HERE – REPLACE THIS WITH YOUR ACTUAL SCRIPT
      // ==========================================================
      const yourScript = `
-- Your obfuscated script here
-- This is the actual code that will execute
print("Hello from your script")
-- Add your real code below
`;

      return withCors(new Response(yourScript, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }));
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
    // API - CREATE SCRIPT
    // ============================================================
    if (path === '/api/scripts' && method === 'POST') {
      try {
        const body = await request.json();
        const scriptId = 'script_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
        
        // In production: save to KV
        // await env.KERSFORGE_KV.put(scriptId, body.code);

        return withCors(new Response(JSON.stringify({
          success: true,
          id: scriptId,
          loaderUrl: `${url.origin}/api/public/loaders/${scriptId}/lua`
        }), {
          headers: { 'Content-Type': 'application/json' }
        }));
      } catch (e) {
        return withCors(new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
    }

    // ============================================================
    // FALLBACK – 404
    // ============================================================
    return withCors(new Response('Not Found', { status: 404 }));
  }
};
