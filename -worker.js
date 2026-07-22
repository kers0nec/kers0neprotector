// _worker.js – KERSFORGE (FAULMOR-STYLE LOADER)
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================================
    // LOADER - FAULMOR-STYLE URL FORMAT
    // /api/public/loaders/SCRIPT_ID/lua
    // ============================================================
    if (path.startsWith('/api/public/loaders/') && path.endsWith('/lua')) {
      // Extract script ID from the path
      // Example: /api/public/loaders/script_abc123/lua
      const parts = path.split('/');
      // parts = ['', 'api', 'public', 'loaders', 'script_abc123', 'lua']
      const scriptId = parts[4]; // The 5th element (index 4)
      
      if (!scriptId || scriptId === '') {
        return new Response('-- Error: No script ID provided', {
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // This is the actual Lua script that will execute
      const luaScript = `
-- KERSFORGE PROTECTED SCRIPT
-- Script ID: ${scriptId}
-- Format: Faulmor-style loader

print("✅ KERSFORGE script loaded!")
print("📜 Script ID: ${scriptId}")

-- Your actual script goes here
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
print("👤 Player: " .. tostring(LocalPlayer))
print("🌐 Place ID: " .. tostring(game.PlaceId))

-- MAIN SCRIPT LOGIC
print("🚀 Script is running!")

-- PUT YOUR CODE HERE
-- Example: 
-- local function main()
--     print("Hello from your script!")
-- end
-- main()

print("✅ Script execution complete!")
return true
`;

      return new Response(luaScript, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ============================================================
    // SUPPORT LEGACY /loader/ FORMAT TOO
    // ============================================================
    if (path.startsWith('/loader/')) {
      const scriptId = path.replace('/loader/', '');
      
      const luaScript = `
-- KERSFORGE PROTECTED SCRIPT
-- Script ID: ${scriptId}
print("✅ KERSFORGE script loaded!")
print("📜 Script ID: ${scriptId}")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
print("👤 Player: " .. tostring(LocalPlayer))
print("🚀 Script is running!")
return true
`;

      return new Response(luaScript, {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-store'
        }
      });
    }

    // ============================================================
    // SERVE HTML FILES
    // ============================================================
    if (path === '/' || path === '/index.html' || path === '/dashboard.html' || path === '/admin.html' || path === '/callback.html') {
      return fetch(request);
    }

    // ============================================================
    // API - CREATE SCRIPT
    // ============================================================
    if (path === '/api/create-script' && request.method === 'POST') {
      try {
        const body = await request.json();
        const scriptId = 'script_' + Math.random().toString(36).substring(2, 10);
        return new Response(JSON.stringify({
          success: true,
          id: scriptId,
          script: { ...body, id: scriptId }
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

    // ============================================================
    // API - GET DATA
    // ============================================================
    if (path === '/api/data') {
      // In production, fetch from KV/database
      return new Response(JSON.stringify({
        scripts: [],
        keys: [],
        bannedHWIDs: [],
        serverTime: Date.now()
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ============================================================
    // API - DELETE SCRIPT
    // ============================================================
    if (path === '/api/delete-script' && request.method === 'POST') {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ============================================================
    // API - GENERATE KEY
    // ============================================================
    if (path === '/api/generate-key' && request.method === 'POST') {
      const key = 'KF-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      return new Response(JSON.stringify({ success: true, key: key }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ============================================================
    // API - DELETE KEY
    // ============================================================
    if (path === '/api/delete-key' && request.method === 'POST') {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ============================================================
    // API - BAN HWID
    // ============================================================
    if (path === '/api/ban-hwid' && request.method === 'POST') {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ============================================================
    // API - UNBAN HWID
    // ============================================================
    if (path === '/api/unban-hwid' && request.method === 'POST') {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ============================================================
    // TERMS PAGE
    // ============================================================
    if (path === '/terms') {
      return new Response(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>KERSFORGE - Terms</title>
<style>body{font-family:sans-serif;background:#0a0a0a;color:#e0e0e0;padding:40px;display:flex;justify-content:center}.container{max-width:700px;background:rgba(10,10,10,0.9);padding:40px;border-radius:16px;border:1px solid rgba(180,0,0,0.2)}h1{color:#cc0000}p{color:#666;line-height:1.6}a{color:#cc0000}</style>
</head><body><div class="container">
<h1>KERSFORGE</h1>
<h2>Terms of Service</h2>
<p>By using KERSFORGE, you agree to these terms. License keys are personal and non-transferable. HWID spoofing or key resale results in permanent ban.</p>
<h2>Privacy Policy</h2>
<p>We store your email, username, scripts, keys, and HWID for license validation. We never share your data with third parties.</p>
<p><a href="/">← Back</a></p>
</div></body></html>`, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // ============================================================
    // FALLBACK
    // ============================================================
    return fetch(request);
  }
};
