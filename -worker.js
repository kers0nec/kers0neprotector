// _worker.js – KERS0NE PROTECTION (Updated for new domain)
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

    // ============ API ROUTES ============
    if (path === '/api/data') {
      // In production, fetch from your database/KV store
      // For now, return sample data with the correct domain
      return new Response(JSON.stringify({
        domain: 'https://kers0neprotector.pages.dev',
        scripts: [
          { id: 'script_abc123', name: 'Universal Hub', status: 'active', ffaMode: false, compressMode: true },
          { id: 'script_def456', name: 'Aim Assist', status: 'disabled', ffaMode: true, compressMode: false }
        ],
        panels: [],
        keys: [],
        bannedHWIDs: [],
        serverTime: Date.now()
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
        }
      });
    }

    // Handle OPTIONS preflight for API
    if (path === '/api/data' && request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
        }
      });
    }

    // ============ CREATE SCRIPT ============
    if (path === '/api/create-script' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { name, code, compressMode, type } = body;
        
        // Generate a script ID
        const scriptId = 'script_' + Math.random().toString(36).substring(2, 10);
        
        // Store in KV (you'll need to set up KV binding)
        // For now, return success with the ID
        return new Response(JSON.stringify({
          success: true,
          id: scriptId,
          message: 'Script created successfully'
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to create script' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ============ UPDATE SCRIPT ============
    if (path === '/api/update-script' && request.method === 'POST') {
      try {
        const body = await request.json();
        // In production, update in KV
        return new Response(JSON.stringify({
          success: true,
          message: 'Script updated successfully'
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to update script' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ============ TOGGLE SCRIPT ============
    if (path.startsWith('/api/scripts/') && path.endsWith('/toggle') && request.method === 'PUT') {
      const scriptId = path.split('/')[3];
      return new Response(JSON.stringify({
        success: true,
        status: 'active'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ============ TOGGLE FFA ============
    if (path.startsWith('/api/scripts/') && path.endsWith('/ffa') && request.method === 'PUT') {
      const scriptId = path.split('/')[3];
      return new Response(JSON.stringify({
        success: true,
        ffaMode: true
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ============ DELETE SCRIPT ============
    if (path === '/api/delete-script' && request.method === 'POST') {
      try {
        const body = await request.json();
        return new Response(JSON.stringify({
          success: true,
          message: 'Script deleted successfully'
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to delete script' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ============ GENERATE KEY ============
    if (path === '/api/generate-key' && request.method === 'POST') {
      try {
        const body = await request.json();
        const key = 'KEY_' + Math.random().toString(36).substring(2, 10).toUpperCase();
        return new Response(JSON.stringify({
          success: true,
          key: key,
          message: 'Key generated successfully'
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to generate key' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ============ DELETE KEY ============
    if (path === '/api/delete-key' && request.method === 'POST') {
      try {
        const body = await request.json();
        return new Response(JSON.stringify({
          success: true,
          message: 'Key deleted successfully'
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to delete key' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ============ ADD TIME ALL ============
    if (path === '/api/add-time-all' && request.method === 'POST') {
      return new Response(JSON.stringify({
        success: true,
        updated: 5,
        message: 'Time added to all active keys'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ============ BAN HWID ============
    if (path === '/api/ban-hwid' && request.method === 'POST') {
      try {
        const body = await request.json();
        return new Response(JSON.stringify({
          success: true,
          message: 'HWID banned successfully'
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to ban HWID' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ============ UNBAN HWID ============
    if (path === '/api/unban-hwid' && request.method === 'POST') {
      try {
        const body = await request.json();
        return new Response(JSON.stringify({
          success: true,
          message: 'HWID unbanned successfully'
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to unban HWID' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ============ SEND PANEL ============
    if (path === '/api/send-panel' && request.method === 'POST') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Panel sent to Discord successfully'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ============ CREATE PANEL ============
    if (path === '/api/create-panel' && request.method === 'POST') {
      try {
        const body = await request.json();
        const panelId = 'panel_' + Math.random().toString(36).substring(2, 10);
        return new Response(JSON.stringify({
          success: true,
          id: panelId,
          message: 'Panel created successfully'
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to create panel' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ============ DELETE PANEL ============
    if (path === '/api/delete-panel' && request.method === 'POST') {
      try {
        const body = await request.json();
        return new Response(JSON.stringify({
          success: true,
          message: 'Panel deleted successfully'
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to delete panel' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ============ UPDATE PANEL ============
    if (path === '/api/update-panel' && request.method === 'POST') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Panel updated successfully'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ============ LOADER ROUTES ============
    if (path.startsWith('/loader/')) {
      const scriptId = path.replace('/loader/', '');
      const key = url.searchParams.get('key');
      const domain = 'https://kers0neprotector.pages.dev';
      
      // Get script info (in production, fetch from KV)
      // For now, return a sample response
      
      // FFA Mode - no key required
      if (scriptId === 'script_abc123') {
        return new Response(`-- FFA MODE - No key required\n-- Script ID: ${scriptId}\n-- Domain: ${domain}\n\nlocal loadstring = loadstring or function(s) return loadstring(s) end\nloadstring(game:HttpGet("${domain}/script/${scriptId}"))()`, {
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      // Key System - key required
      if (!key) {
        return new Response(`-- ERROR: Key required for this script\n-- Script ID: ${scriptId}\n-- Please provide a valid key: ?key=YOUR_KEY\n\n-- Usage: loadstring(game:HttpGet("${domain}/loader/${scriptId}?key=YOUR_KEY"))()`, {
          status: 403,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      // Validate key (in production, check against KV/database)
      // For now, accept any key that's not empty
      if (key && key.length > 0) {
        return new Response(`-- Key System - Valid key provided\n-- Script ID: ${scriptId}\n-- Domain: ${domain}\n\nlocal loadstring = loadstring or function(s) return loadstring(s) end\nloadstring(game:HttpGet("${domain}/script/${scriptId}"))()`, {
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      return new Response(`-- Invalid key for script: ${scriptId}`, {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // ============ SCRIPT ROUTES ============
    if (path.startsWith('/script/')) {
      const scriptId = path.replace('/script/', '');
      // In production, fetch the obfuscated script from KV/database
      // For now, return a sample obfuscated script
      return new Response(`-- KERS0NE PROTECTION - Obfuscated Script\n-- Script ID: ${scriptId}\n-- Domain: https://kers0neprotector.pages.dev\n\nlocal function protected()\n    local http = game:GetService("HttpService")\n    local players = game:GetService("Players")\n    local lp = players.LocalPlayer\n    \n    print("Protected by KERS0NE PROTECTION")\n    print("Script ID: ${scriptId}")\n    \n    -- Your obfuscated code goes here\n    -- This is a sample. In production, this would be your obfuscated script.\n    \n    -- Example: Load the actual script from a secure source\n    -- loadstring(game:HttpGet("https://kers0neprotector.pages.dev/secure/" .. ${scriptId}))()\nend\n\nprotected()`, {
        headers: { 
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      });
    }

    // ============ TERMS PAGE ============
    if (path === '/terms') {
      return new Response(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>KERS0NE PROTECTION - Terms</title>
<style>body{font-family:Arial,sans-serif;background:#09090b;color:#f8fafc;padding:40px;display:flex;justify-content:center}.container{background:#1a1a1e;border:1px solid #2a2a2e;border-radius:16px;padding:40px;max-width:700px;width:100%}h1{color:#6366f1}h2{color:#f8fafc;margin-top:25px}p{color:#9ca3af;line-height:1.7}a{color:#6366f1;text-decoration:none}</style>
</head>
<body>
<div class="container">
<h1>KERS0NE PROTECTION</h1>
<h2>Terms of Service</h2>
<p>By using KERS0NE PROTECTION, you agree to these terms. License keys are personal and non-transferable. HWID spoofing or key resale results in permanent ban.</p>
<h2>Privacy Policy</h2>
<p>We store Discord ID, username, avatar, and HWID for license validation. We never share your data with third parties.</p>
<p style="margin-top:20px"><a href="/">← Back to Login</a></p>
</div>
</body>
</html>`, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Fallback to static assets
    return env.ASSETS.fetch(request);
  }
};
