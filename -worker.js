// _worker.js – KERS0NE PROTECTION (FIXED OAuth Routes)
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============ DISCORD OAUTH - MUST BE FIRST ============
    if (path === '/auth/discord') {
      const state = crypto.randomUUID();
      const redirectUri = 'https://kers0neprotector.pages.dev/auth/discord/callback';
      const params = new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
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
            client_id: env.DISCORD_CLIENT_ID,
            client_secret: env.DISCORD_CLIENT_SECRET,
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

    // ============ SERVE STATIC FILES ============
    if (path === '/' || path === '/index.html') {
      return env.ASSETS.fetch(request);
    }

    // ============ API ROUTES ============
    // ... (rest of your API routes here)

    // Fallback to static assets
    return env.ASSETS.fetch(request);
  }
};
