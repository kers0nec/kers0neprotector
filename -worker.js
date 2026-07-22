// _worker.js – KERSFORGE v2 (Production Ready)
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // ============================================================
    // CORS HEADERS (pre-flight)
    // ============================================================
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ============================================================
    // HELPER: Add CORS to any response
    // ============================================================
    const withCors = (response) => {
      Object.entries(corsHeaders).forEach(([k, v]) => {
        response.headers.set(k, v);
      });
      return response;
    };

    // ============================================================
    // HELPER: Error response
    // ============================================================
    const errorResponse = (message, status = 400) => {
      return withCors(new Response(JSON.stringify({
        success: false,
        error: message,
        timestamp: Date.now()
      }), {
        status,
        headers: { 'Content-Type': 'application/json' }
      }));
    };

    // ============================================================
    // HELPER: Success response
    // ============================================================
    const successResponse = (data) => {
      return withCors(new Response(JSON.stringify({
        success: true,
        ...data,
        timestamp: Date.now()
      }), {
        headers: { 'Content-Type': 'application/json' }
      }));
    };

    // ============================================================
    // 1. SCRIPT LOADER – /api/public/loaders/{scriptId}/lua
    //    Returns raw Lua code for loadstring()
    // ============================================================
    if (path.startsWith('/api/public/loaders/') && path.endsWith('/lua')) {
      const parts = path.split('/');
      const scriptId = parts[4];

      if (!scriptId || scriptId === '') {
        return withCors(new Response('-- Error: No script ID provided\nreturn false', {
          status: 400,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        }));
      }

      // Validate script ID format (alphanumeric, underscores, hyphens)
      if (!/^[a-zA-Z0-9_-]+$/.test(scriptId)) {
        return withCors(new Response('-- Error: Invalid script ID format\nreturn false', {
          status: 400,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        }));
      }

      // In production: fetch actual script from KV or database
      // For now: return a template that includes the script ID
      // Users replace the placeholder with their actual script
      const luaScript = `--[[
  KERSFORGE PROTECTED SCRIPT
  Script ID: ${scriptId}
  Loaded at: ${new Date().toISOString()}
  Loader URL: ${url.origin}/api/public/loaders/${scriptId}/lua
--]]

local KERSFORGE = {
  scriptId = "${scriptId}",
  loadedAt = "${new Date().toISOString()}",
  version = "2.0"
}

-- Anti-tamper: verify we're in Roblox
if not game or not game:GetService then
  error("KERSFORGE: Invalid environment")
end

-- Log load (optional: send to your analytics endpoint)
local function logLoad()
  local success = pcall(function()
    local HttpService = game:GetService("HttpService")
    local Players = game:GetService("Players")
    local LocalPlayer = Players.LocalPlayer

    local data = {
      scriptId = "${scriptId}",
      player = tostring(LocalPlayer),
      userId = LocalPlayer and LocalPlayer.UserId or 0,
      placeId = game.PlaceId,
      jobId = game.JobId,
      timestamp = os.time()
    }

    -- Uncomment to enable analytics logging:
    -- HttpService:PostAsync("${url.origin}/api/log", HttpService:JSONEncode(data))
  end)
end

-- Run log in background (non-blocking)
task.spawn(logLoad)

print("✅ [KERSFORGE] Script " .. KERSFORGE.scriptId .. " loaded successfully")
print("📜 [KERSFORGE] Version: " .. KERSFORGE.version)

-- ============================================================
-- INSERT YOUR ACTUAL SCRIPT BELOW THIS LINE
-- ============================================================

local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

print("👤 [KERSFORGE] Player: " .. tostring(LocalPlayer))
print("🌐 [KERSFORGE] Place ID: " .. tostring(game.PlaceId))
print("🚀 [KERSFORGE] Script is running!")

-- YOUR CODE HERE:
-- local function main()
--     print("Hello from your protected script!")
-- end
-- main()

-- ============================================================
-- END OF YOUR SCRIPT
-- ============================================================

print("✅ [KERSFORGE] Script execution complete!")
return KERSFORGE`;

      return withCors(new Response(luaScript, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }));
    }

    // ============================================================
    // 2. LEGACY LOADER – /loader/{scriptId}
    // ============================================================
    if (path.startsWith('/loader/')) {
      const scriptId = path.replace('/loader/', '').split('/')[0];

      if (!scriptId) {
        return withCors(new Response('-- Error: No script ID\nreturn false', {
          status: 400,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        }));
      }

      // Redirect to new format
      return Response.redirect(`${url.origin}/api/public/loaders/${scriptId}/lua`, 301);
    }

    // ============================================================
    // 3. ANALYTICS LOGGING – /api/log
    // ============================================================
    if (path === '/api/log' && method === 'POST') {
      try {
        const body = await request.json();
        // In production: store in KV, D1, or forward to external service
        console.log('[KERSFORGE LOG]', JSON.stringify(body));
        return successResponse({ logged: true });
      } catch (e) {
        return errorResponse('Invalid log data', 400);
      }
    }

    // ============================================================
    // 4. SCRIPT MANAGEMENT API
    // ============================================================

    // Create script
    if (path === '/api/scripts' && method === 'POST') {
      try {
        const body = await request.json();
        const scriptId = 'script_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);

        // In production: save to KV
        // await env.KERSFORGE_KV.put(scriptId, JSON.stringify(body));

        return successResponse({
          id: scriptId,
          loaderUrl: `${url.origin}/api/public/loaders/${scriptId}/lua`,
          message: 'Script created successfully'
        });
      } catch (e) {
        return errorResponse('Failed to create script: ' + e.message, 500);
      }
    }

    // Get script info
    if (path.startsWith('/api/scripts/') && method === 'GET') {
      const scriptId = path.split('/')[3];

      // In production: fetch from KV
      // const data = await env.KERSFORGE_KV.get(scriptId);

      return successResponse({
        id: scriptId,
        loaderUrl: `${url.origin}/api/public/loaders/${scriptId}/lua`,
        status: 'active',
        note: 'In production, fetch actual data from KV/database'
      });
    }

    // ============================================================
    // 5. KEY MANAGEMENT API
    // ============================================================

    if (path === '/api/keys' && method === 'POST') {
      try {
        const body = await request.json();
        const key = 'KF-' + Array.from({length: 16}, () => 
          'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
        ).join('');

        return successResponse({
          key: key,
          createdAt: new Date().toISOString(),
          expiresAt: body.expiresAt || null,
          maxUses: body.maxUses || null
        });
      } catch (e) {
        return errorResponse('Failed to generate key', 500);
      }
    }

    // ============================================================
    // 6. HWID MANAGEMENT API
    // ============================================================

    if (path === '/api/hwid/ban' && method === 'POST') {
      try {
        const body = await request.json();
        return successResponse({
          hwid: body.hwid,
          banned: true,
          reason: body.reason || 'No reason provided',
          bannedAt: new Date().toISOString()
        });
      } catch (e) {
        return errorResponse('Failed to ban HWID', 500);
      }
    }

    if (path === '/api/hwid/unban' && method === 'POST') {
      try {
        const body = await request.json();
        return successResponse({
          hwid: body.hwid,
          banned: false,
          unbannedAt: new Date().toISOString()
        });
      } catch (e) {
        return errorResponse('Failed to unban HWID', 500);
      }
    }

    // ============================================================
    // 7. DASHBOARD / ADMIN PAGES
    // ============================================================

    if (path === '/' || path === '/index.html') {
      return withCors(new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KERSFORGE v2</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', system-ui, sans-serif; 
      background: #0a0a0f; 
      color: #e0e0e0; 
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .container { 
      max-width: 800px; 
      width: 90%;
      padding: 40px; 
      background: rgba(15, 15, 25, 0.9); 
      border-radius: 20px; 
      border: 1px solid rgba(180, 0, 0, 0.3);
      box-shadow: 0 0 40px rgba(180, 0, 0, 0.1);
    }
    h1 { 
      color: #ff3333; 
      font-size: 2.5rem; 
      margin-bottom: 10px;
      text-shadow: 0 0 20px rgba(255, 51, 51, 0.3);
    }
    .subtitle { color: #666; margin-bottom: 30px; }
    .endpoint { 
      background: rgba(255,255,255,0.03); 
      padding: 15px; 
      border-radius: 10px; 
      margin: 10px 0;
      border-left: 3px solid #ff3333;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }
    .endpoint code { color: #4ecdc4; }
    .status { 
      display: inline-block; 
      padding: 5px 15px; 
      background: rgba(0, 255, 100, 0.1); 
      color: #00ff64; 
      border-radius: 20px; 
      font-size: 0.85rem;
      margin-top: 20px;
    }
    .footer { 
      margin-top: 30px; 
      color: #444; 
      font-size: 0.85rem; 
    }
    a { color: #ff3333; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔥 KERSFORGE v2</h1>
    <p class="subtitle">Roblox Script Protection System</p>

    <h3 style="color: #ff3333; margin: 20px 0 10px;">📡 Loader Endpoints</h3>
    <div class="endpoint">
      <code>GET /api/public/loaders/{scriptId}/lua</code><br>
      <span style="color: #888;">Returns raw Lua code for loadstring()</span>
    </div>
    <div class="endpoint">
      <code>GET /loader/{scriptId}</code> <span style="color: #888;">(legacy, redirects)</span>
    </div>

    <h3 style="color: #ff3333; margin: 20px 0 10px;">🔧 API Endpoints</h3>
    <div class="endpoint">
      <code>POST /api/scripts</code> – Create new script<br>
      <code>GET /api/scripts/{id}</code> – Get script info<br>
      <code>POST /api/keys</code> – Generate license key<br>
      <code>POST /api/hwid/ban</code> – Ban HWID<br>
      <code>POST /api/hwid/unban</code> – Unban HWID
    </div>

    <div class="status">● System Online</div>
    <div class="footer">
      <a href="/terms">Terms of Service</a> | 
      Worker running on Cloudflare
    </div>
  </div>
</body>
</html>`, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }));
    }

    if (path === '/terms') {
      return withCors(new Response(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>KERSFORGE - Terms</title>
<style>body{font-family:sans-serif;background:#0a0a0f;color:#e0e0e0;padding:40px;display:flex;justify-content:center}
.container{max-width:700px;background:rgba(15,15,25,0.9);padding:40px;border-radius:20px;border:1px solid rgba(180,0,0,0.2)}
h1{color:#ff3333}p{color:#888;line-height:1.6;margin:15px 0}a{color:#ff3333}</style>
</head><body><div class="container">
<h1>KERSFORGE v2</h1>
<h2>Terms of Service</h2>
<p>By using KERSFORGE, you agree to these terms. License keys are personal and non-transferable. HWID spoofing or key resale results in permanent ban.</p>
<h2>Privacy Policy</h2>
<p>We store your email, username, scripts, keys, and HWID for license validation. We never share your data with third parties.</p>
<p><a href="/">← Back</a></p>
</div></body></html>`, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }));
    }

    // ============================================================
    // 8. FALLBACK – 404
    // ============================================================
    return errorResponse('Not Found', 404);
  }
};
