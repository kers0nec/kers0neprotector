const { exec } = require('child_process');
const http = require('http');

// Start Go binary if it exists
exec('./kers0neprotector', (error, stdout, stderr) => {
  if (error) {
    console.log('Go binary not found, running Node fallback...');
    startNodeFallback();
  } else {
    console.log('Go binary started:', stdout);
  }
});

// Also run worker.js
require('./worker.js');

// Node fallback HTTP server (if Go fails)
function startNodeFallback() {
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Butter\'s bot running on Node fallback');
  });
  server.listen(process.env.PORT || 10000, () => {
    console.log('Node fallback running on port', process.env.PORT || 10000);
  });
}
