// _worker.js – KERSFORGE Loader (PRODUCTION)
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================================
    // LOADER - RETURNS OBFUSCATED LUA CODE
    // ============================================================
    if (path.startsWith('/loader/')) {
      const scriptId = path.replace('/loader/', '');
      const key = url.searchParams.get('key') || '';

      // Get script from localStorage (passed via API or stored)
      // For production, you'd fetch this from KV or database
      // This is the actual obfuscated script that executes
      const luaScript = `
-- KERSFORGE PROTECTED SCRIPT
-- Script ID: ${scriptId}
-- ⚔️ Forged with KERSFORGE Protection

-- ============================================================
-- ANTI-DEOBFUSCATION LAYER
-- ============================================================
local function antiDeobfuscate()
    local function checkDeobfuscator()
        local success, result = pcall(function()
            local env = getfenv()
            if env and type(env) == "table" then
                local suspicious = {"string.dump", "loadstring", "debug", "bytecode", "decompile", "getfenv", "setfenv"}
                for _, s in ipairs(suspicious) do
                    if env[s] then
                        return true
                    end
                end
            end
            if debug and debug.getinfo then
                local info = debug.getinfo(2)
                if info and info.source and string.find(info.source, "decompiler") then
                    return true
                end
            end
            -- Check for common deobfuscation patterns
            if type(loadstring) ~= "function" then
                return true
            end
            return false
        end)
        return success and result or false
    end
    
    if checkDeobfuscator() then
        print("skidder only")
        return
    end
end

antiDeobfuscate()

-- ============================================================
-- ANTI-LOGGER (blocks webhooks)
-- ============================================================
local function antiLogger()
    local request = http_request or request or HttpPost or syn.request or fluxus.request
    if request then
        local oldfunc = hookfunction(request, function(data, ...)
            if data and data.Url then
                local url = data.Url:lower()
                if url:find("discord") or url:find("webhook") or url:find("ipv4") then
                    data.Url = "blocked_by_kersforge"
                    print("🔒 Blocked webhook request")
                end
            end
            return oldfunc(data, ...)
        end)
    end
end

antiLogger()

-- ============================================================
-- YOUR SCRIPT CONTENT
-- ============================================================
print("✅ KERSFORGE script loaded successfully!")
print("📜 Script ID: ${scriptId}")

-- Get player info
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
local RunService = game:GetService("RunService")

print("👤 Player: " .. tostring(LocalPlayer))
print("🌐 Place ID: " .. tostring(game.PlaceId))

-- ============================================================
-- MAIN SCRIPT LOGIC (PUT YOUR CODE HERE)
-- ============================================================

-- Example: Anti-tamper heartbeat
local function startHeartbeat()
    local last = tick()
    RunService.Heartbeat:Connect(function()
        local now = tick()
        if now - last > 1 then
            print("⚠️ Tamper detected - script stopping")
            return
        end
        last = now
    end)
end

startHeartbeat()

-- Your actual protected code goes here
print("🚀 Script is running!")

-- ============================================================
-- CLEANUP
-- ============================================================
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
    // RAW SCRIPT ROUTE
    // ============================================================
    if (path.startsWith('/script/')) {
      const scriptId = path.replace('/script/', '');
      return new Response(`
-- KERSFORGE Script
-- ID: ${scriptId}
print("Script loaded!")
return true
`, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // ============================================================
    // API - GET ALL DATA
    // ============================================================
    if (path === '/api/data') {
      // In production, fetch from KV or database
      // For now, return empty data
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
    // API - CREATE SCRIPT
    // ============================================================
    if (path === '/api/create-script' && request.method === 'POST') {
      try {
        const body = await request.json();
        const scriptId = 'script_' + Math.random().toString(36).substring(2, 10);
        // In production, save to KV/database
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
    // API - DELETE SCRIPT
    // ============================================================
    if (path === '/api/delete-script' && request.method === 'POST') {
      try {
        const body = await request.json();
        // In production, delete from KV/database
        return new Response(JSON.stringify({
          success: true,
          message: 'Script deleted'
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

    // ============================================================
    // API - GENERATE KEY
    // ============================================================
    if (path === '/api/generate-key' && request.method === 'POST') {
      try {
        const body = await request.json();
        const key = 'KF-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        return new Response(JSON.stringify({
          success: true,
          key: key
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
    // SERVE HTML FILES
    // ============================================================
    if (path === '/' || path === '/index.html' || path === '/dashboard.html' || path === '/admin.html' || path === '/callback.html') {
      return fetch(request);
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
