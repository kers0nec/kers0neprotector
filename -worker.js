// _worker.js – KERS0NE PROTECTION (FIXED LOADER)
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================================
    // LOADER ROUTE - MUST BE FIRST
    // ============================================================
    if (path.startsWith('/loader/')) {
      const scriptId = path.replace('/loader/', '');
      const key = url.searchParams.get('key');
      const domain = 'https://kers0neprotector.pages.dev';
      
      try {
        // Get scripts from KV or localStorage (via API)
        // For now, return a simple test script
        const scriptContent = `
-- KERS0NE PROTECTION - Obfuscated Script
-- Script ID: ${scriptId}
-- This script is protected by KERS0NE PROTECTION

print("Script loaded successfully!")
print("Script ID: ${scriptId}")
print("Domain: ${domain}")

-- Your protected code goes here
-- This is a placeholder for the obfuscated script

local function main()
    print("Hello from protected script!")
    return true
end

main()
        `;

        // Check if FFA mode (no key required) - you can store this in KV
        // For now, just return the script
        return new Response(scriptContent, {
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        return new Response(`-- Error loading script: ${e.message}`, {
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }

    // ============================================================
    // SCRIPT ROUTE - Serves the actual script content
    // ============================================================
    if (path.startsWith('/script/')) {
      const scriptId = path.replace('/script/', '');
      
      // Return the script content
      return new Response(`
-- KERS0NE PROTECTION - Script Content
-- Script ID: ${scriptId}

print("Script loaded from /script/ endpoint")
print("ID: ${scriptId}")

-- Your obfuscated code goes here
-- This is a placeholder

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
    if (path === '/' || path === '/index.html' || path === '/dashboard.html') {
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
    // FALLBACK - Return 404 for unknown routes
    // ============================================================
    return new Response('Not found', { status: 404 });
  }
};
