// _worker.js – KERSFORGE Loader
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // LOADER - Returns Lua code with anti-deobfuscation
    if (path.startsWith('/loader/')) {
      const scriptId = path.replace('/loader/', '');
      
      // This is the obfuscated Lua that gets executed
      const luaCode = `
-- KERSFORGE PROTECTED SCRIPT
-- Anti-Deobfuscation Active
-- Script ID: ${scriptId}

local function antiDeobfuscate()
    local function checkDeobfuscator()
        local success, result = pcall(function()
            local env = getfenv()
            if env and type(env) == "table" then
                local suspicious = {"string.dump", "loadstring", "debug", "bytecode", "decompile"}
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
            return false
        end)
        return success and result or false
    end
    
    if checkDeobfuscator() then
        print("skidder only")
        return
    end
    
    if type(loadstring) ~= "function" then
        print("skidder only")
        return
    end
end

antiDeobfuscate()

-- Your script content goes here
print("✅ KERSFORGE script loaded!")
print("📜 Script ID: ${scriptId}")

-- Protected script logic
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
print("👤 Player: " .. tostring(LocalPlayer))

-- Main script
print("🚀 Script is running!")
return true
`;

      return new Response(luaCode, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // SCRIPT ROUTE
    if (path.startsWith('/script/')) {
      const scriptId = path.replace('/script/', '');
      return new Response(`-- KERSFORGE Script ${scriptId}\nprint("Script loaded!")`, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // API
    if (path === '/api/data') {
      const data = {
        scripts: [
          { id: 'script_demo', name: 'Demo Script', status: 'active', ffaMode: false, compressMode: true, antiDeobfuscate: true }
        ],
        keys: [],
        bannedHWIDs: []
      };
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // SERVE HTML FILES
    if (path === '/' || path === '/index.html' || path === '/dashboard.html' || path === '/admin.html' || path === '/callback.html') {
      return fetch(request);
    }

    return fetch(request);
  }
};
