// _worker.js – KERS0NE PROTECTION
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================================
    // DISCORD OAUTH (MUST BE FIRST)
    // ============================================================
    if (path === '/auth/discord') {
      const state = crypto.randomUUID();
      const redirectUri = 'https://kers0neprotector.pages.dev/auth/discord/callback';
      const params = new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID || '1529265967534837780',
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'identify guilds',
        state: state
      });
      
      const response = Response.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`, 302);
      response.headers.set('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
      return response;
    }

    if (path === '/auth/discord/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const cookieState = request.headers.get('Cookie')?.match(/oauth_state=([^;]+)/)?.[1];

      if (!code || !state || state !== cookieState) {
        return new Response('Invalid OAuth state', { status: 403 });
      }

      try {
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: env.DISCORD_CLIENT_ID || '1529265967534837780',
            client_secret: env.DISCORD_CLIENT_SECRET || '',
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'https://kers0neprotector.pages.dev/auth/discord/callback'
          })
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) throw new Error('Failed to get token');

        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const user = await userResponse.json();

        const redirectUrl = new URL('/', request.url);
        redirectUrl.searchParams.set('user', user.username);
        redirectUrl.searchParams.set('id', user.id);
        redirectUrl.searchParams.set('avatar', user.avatar || '');
        redirectUrl.searchParams.set('token', tokenData.access_token);
        
        const response = Response.redirect(redirectUrl.toString(), 302);
        response.headers.set('Set-Cookie', `oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
        return response;
      } catch (error) {
        console.error('OAuth error:', error);
        return new Response('Authentication failed: ' + error.message, { status: 500 });
      }
    }

    // ============================================================
    // SERVE HTML
    // ============================================================
    if (path === '/' || path === '/index.html') {
      return env.ASSETS.fetch(request);
    }

    // ============================================================
    // API ROUTES
    // ============================================================
    if (path === '/api/data') {
      try {
        const scripts = await env.KERSONE_DATA?.get('scripts', 'json') || [];
        const keys = await env.KERSONE_DATA?.get('keys', 'json') || [];
        const banned = await env.KERSONE_DATA?.get('banned_hwids', 'json') || [];
        return new Response(JSON.stringify({ scripts, keys, bannedHWIDs: banned }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (path === '/api/create-script' && request.method === 'POST') {
      try {
        const body = await request.json();
        const scriptId = 'script_' + Math.random().toString(36).substring(2, 10);
        const newScript = { ...body, id: scriptId, createdAt: Date.now() };
        let scripts = await env.KERSONE_DATA?.get('scripts', 'json') || [];
        scripts.unshift(newScript);
        await env.KERSONE_DATA?.put('scripts', JSON.stringify(scripts));
        return new Response(JSON.stringify({ success: true, id: scriptId }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to create script' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (path === '/api/delete-script' && request.method === 'POST') {
      try {
        const body = await request.json();
        let scripts = await env.KERSONE_DATA?.get('scripts', 'json') || [];
        scripts = scripts.filter(s => s.id !== body.id);
        await env.KERSONE_DATA?.put('scripts', JSON.stringify(scripts));
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to delete script' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (path === '/api/generate-key' && request.method === 'POST') {
      try {
        const body = await request.json();
        const key = 'KEY_' + Math.random().toString(36).substring(2, 10).toUpperCase();
        const newKey = {
          key: key,
          note: body.note || '',
          durationHours: body.durationHours || 0,
          expiresAt: body.durationHours > 0 ? Date.now() + body.durationHours * 3600000 : null,
          createdAt: Date.now()
        };
        let keys = await env.KERSONE_DATA?.get('keys', 'json') || [];
        keys.push(newKey);
        await env.KERSONE_DATA?.put('keys', JSON.stringify(keys));
        return new Response(JSON.stringify({ success: true, key: key }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to generate key' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (path === '/api/delete-key' && request.method === 'POST') {
      try {
        const body = await request.json();
        let keys = await env.KERSONE_DATA?.get('keys', 'json') || [];
        keys = keys.filter(k => k.key !== body.key);
        await env.KERSONE_DATA?.put('keys', JSON.stringify(keys));
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to delete key' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (path === '/api/ban-hwid' && request.method === 'POST') {
      try {
        const body = await request.json();
        let banned = await env.KERSONE_DATA?.get('banned_hwids', 'json') || [];
        if (!banned.find(b => b.hwid === body.hwid)) {
          banned.push({ hwid: body.hwid, bannedAt: Date.now() });
          await env.KERSONE_DATA?.put('banned_hwids', JSON.stringify(banned));
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to ban HWID' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (path === '/api/unban-hwid' && request.method === 'POST') {
      try {
        const body = await request.json();
        let banned = await env.KERSONE_DATA?.get('banned_hwids', 'json') || [];
        banned = banned.filter(b => b.hwid !== body.hwid);
        await env.KERSONE_DATA?.put('banned_hwids', JSON.stringify(banned));
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to unban HWID' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ============================================================
    // LOADER ROUTES
    // ============================================================
    if (path.startsWith('/loader/')) {
      const scriptId = path.replace('/loader/', '');
      const key = url.searchParams.get('key');
      const domain = 'https://kers0neprotector.pages.dev';
      
      try {
        const scripts = await env.KERSONE_DATA?.get('scripts', 'json') || [];
        const scriptData = scripts.find(s => s.id === scriptId);
        
        if (!scriptData) {
          return new Response(`-- Script not found: ${scriptId}`, {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          });
        }

        // FFA Mode - no key required
        if (scriptData.ffaMode) {
          return new Response(`-- FFA MODE - No key required\n-- Script: ${scriptData.name}\n\nloadstring(game:HttpGet("${domain}/script/${scriptId}"))()`, {
            headers: { 'Content-Type': 'text/plain' }
          });
        }

        // Key System - key required
        if (!key) {
          return new Response(`-- ERROR: Key required for script: ${scriptData.name}\n-- Usage: loadstring(game:HttpGet("${domain}/loader/${scriptId}?key=YOUR_KEY"))()`, {
            status: 403,
            headers: { 'Content-Type': 'text/plain' }
          });
        }

        const keys = await env.KERSONE_DATA?.get('keys', 'json') || [];
        const validKey = keys.find(k => k.key === key);
        
        if (!validKey) {
          return new Response(`-- Invalid key for script: ${scriptData.name}`, {
            status: 403,
            headers: { 'Content-Type': 'text/plain' }
          });
        }

        return new Response(`-- Key System - Valid key\n-- Script: ${scriptData.name}\n\nloadstring(game:HttpGet("${domain}/script/${scriptId}"))()`, {
          headers: { 'Content-Type': 'text/plain' }
        });
      } catch (e) {
        return new Response(`-- Error: ${e.message}`, {
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }

    if (path.startsWith('/script/')) {
      const scriptId = path.replace('/script/', '');
      try {
        const scripts = await env.KERSONE_DATA?.get('scripts', 'json') || [];
        const scriptData = scripts.find(s => s.id === scriptId);
        if (!scriptData) {
          return new Response(`-- Script not found: ${scriptId}`, {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
        return new Response(`-- KERS0NE PROTECTION\n-- Script: ${scriptData.name}\n\n${scriptData.code || '-- No code'}`, {
          headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }
        });
      } catch (e) {
        return new Response(`-- Error: ${e.message}`, {
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }

    // ============================================================
    // TERMS PAGE
    // ============================================================
    if (path === '/terms') {
      return new Response(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>KERS0NE PROTECTION - Terms</title>
<style>body{font-family:Arial;background:#09090b;color:#f8fafc;padding:40px;display:flex;justify-content:center}.container{background:#1a1a1e;border:1px solid #2a2a2e;border-radius:16px;padding:40px;max-width:700px}h1{color:#6366f1}p{color:#9ca3af}a{color:#6366f1}</style>
</head>
<body><div class="container">
<h1>KERS0NE PROTECTION</h1>
<h2>Terms of Service</h2>
<p>By using KERS0NE PROTECTION, you agree to these terms. License keys are personal and non-transferable. HWID spoofing or key resale results in permanent ban.</p>
<h2>Privacy Policy</h2>
<p>We store Discord ID, username, avatar, and HWID for license validation. We never share your data with third parties.</p>
<p><a href="/">← Back</a></p>
</div></body></html>`, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Fallback
    return env.ASSETS.fetch(request);
  }
};
