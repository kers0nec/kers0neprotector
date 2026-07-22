// _worker.js – Handles Discord OAuth, API, and serving pages
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============ SERVE STATIC FILES ============
    if (path === '/' || path === '/index.html') {
      return env.ASSETS.fetch(request);
    }

    // ============ DISCORD OAUTH ============
    if (path === '/auth/discord') {
      const state = crypto.randomUUID();
      // Store state in a cookie or KV store
      const redirectUri = 'https://kers0newhitlistinghosting.pages.dev/auth/discord/callback';
      const params = new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'identify guilds',
        state: state
      });
      
      // Set state cookie
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
        // Exchange code for token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: env.DISCORD_CLIENT_ID,
            client_secret: env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'https://kers0newhitlistinghosting.pages.dev/auth/discord/callback'
          })
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) throw new Error('Failed to get token');

        // Get user info
        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const user = await userResponse.json();

        // Redirect to dashboard with user info in URL params
        const redirectUrl = new URL('/', request.url);
        redirectUrl.searchParams.set('user', user.username);
        redirectUrl.searchParams.set('id', user.id);
        redirectUrl.searchParams.set('avatar', user.avatar || '');
        redirectUrl.searchParams.set('token', tokenData.access_token);
        
        const response = Response.redirect(redirectUrl.toString(), 302);
        // Clear state cookie
        response.headers.set('Set-Cookie', `oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
        return response;
      } catch (error) {
        console.error('OAuth error:', error);
        return new Response('Authentication failed: ' + error.message, { status: 500 });
      }
    }

    // ============ API ROUTES ============
    if (path === '/api/data') {
      // In production, fetch from your database/KV store
      // For now, return sample data
      return new Response(JSON.stringify({
        scripts: [
          { id: 'script_abc123', name: 'Universal Hub', status: 'active', ffaMode: false, compressMode: true },
          { id: 'script_def456', name: 'Aim Assist', status: 'disabled', ffaMode: true, compressMode: false }
        ],
        panels: [],
        keys: [],
        bannedHWIDs: [],
        serverTime: Date.now()
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // ============ LOADER ROUTES ============
    if (path.startsWith('/loader/')) {
      const scriptId = path.replace('/loader/', '');
      return new Response(`-- Loader for script: ${scriptId}\n-- Domain: ${url.origin}\nloadstring(game:HttpGet("${url.origin}/script/${scriptId}"))()`, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (path.startsWith('/script/')) {
      const scriptId = path.replace('/script/', '');
      return new Response(`-- Obfuscated script for: ${scriptId}\nprint("Hello from ${scriptId}!")`, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Fallback to static assets
    return env.ASSETS.fetch(request);
  }
};
