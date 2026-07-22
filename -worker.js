// _worker.js – KERS0NE PROTECTION (FIXED LOADER)
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================================
    // LOADER ROUTE - Returns Lua code that Roblox can execute
    // ============================================================
    if (path.startsWith('/loader/')) {
      const scriptId = path.replace('/loader/', '');
      const key = url.searchParams.get('key');
      const domain = 'https://kers0neprotector.pages.dev';
      
      // THIS IS THE LUA CODE THAT WILL BE EXECUTED
      const luaScript = `
-- KERS0NE PROTECTION - Protected Script
-- Script ID: ${scriptId}
-- Domain: ${domain}

print("✅ KERS0NE PROTECTION loaded!")
print("📜 Script ID: ${scriptId}")

-- Your protected script code goes here
-- This is a placeholder that works

local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

print("👤 Local Player: " .. tostring(LocalPlayer))

-- Main script logic
local function main()
    print("🚀 Script is running!")
    -- Add your actual script logic here
    return true
end

-- Execute main
main()

print("✅ Script execution complete!")
`;

      return new Response(luaScript, {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ============================================================
    // SCRIPT ROUTE - Raw script content
    // ============================================================
    if (path.startsWith('/script/')) {
      const scriptId = path.replace('/script/', '');
      
      return new Response(`
-- KERS0NE PROTECTION - Raw Script
-- Script ID: ${scriptId}

print("Raw script loaded for: ${scriptId}")
return true
      `, {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ============================================================
    // API ROUTES
    // ============================================================
    if (path === '/api/data') {
      try {
        const scripts = [
          { id: 'script_2ikuqprx', name: 'Test Script', status: 'active', ffaMode: false, compressMode: true }
        ];
        return new Response(JSON.stringify({ scripts, keys: [], bannedHWIDs: [] }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ============================================================
    // SERVE STATIC FILES
    // ============================================================
    if (path === '/' || path === '/index.html' || path === '/dashboard.html' || path === '/callback.html') {
      return env.ASSETS.fetch(request);
    }

    // ============================================================
    // TERMS PAGE
    // ============================================================
    if (path === '/terms') {
      return new Response(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Terms</title>
<style>body{font-family:sans-serif;background:#0a0a0f;color:white;padding:40px;display:flex;justify-content:center}.container{max-width:700px;background:rgba(18,18,28,0.8);padding:40px;border-radius:16px;border:1px solid rgba(255,255,255,0.06)}h1{color:#6366f1}p{color:#8a8aa0;line-height:1.6}a{color:#6366f1}</style>
</head><body><div class="container">
<h1>KERS0NE PROTECTION</h1>
<h2>Terms of Service</h2>
<p>By using KERS0NE PROTECTION, you agree to these terms. License keys are personal and non-transferable. HWID spoofing or key resale results in permanent ban.</p>
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
    return env.ASSETS.fetch(request);
  }
};
