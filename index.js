const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head><title>Kers0ne Protector</title></head>
      <body style="font-family: monospace; padding: 40px; background: #0a0a0a; color: #00ff88;">
        <h1>🐱 Kers0ne Protector</h1>
        <p>Butter's bot is <strong>ALIVE</strong> on Render free tier!</p>
        <p>Port: ${process.env.PORT || 10000}</p>
        <p>Status: ✅ Running</p>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🔥 Kers0ne Protector running on port ${PORT}`);
});
