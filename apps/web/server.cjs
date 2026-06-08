const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const DIST = path.join(__dirname, 'dist');
const PORT = parseInt(process.env.PORT || '5173', 10);

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  let url = req.url?.split('?')[0] || '/';

  // SPA fallback: serve index.html for non-file routes
  const ext = path.extname(url);
  if (!ext || ext === '.html') {
    const filePath = ext ? path.join(DIST, url) : path.join(DIST, 'index.html');
    serveFile(filePath, res);
    return;
  }

  const filePath = path.join(DIST, url);
  serveFile(filePath, res);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`[web] Serving static files on http://0.0.0.0:${PORT}`);
});

function serveFile(filePath, res) {
  // Prevent directory traversal
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback for any 404
      fs.readFile(path.join(DIST, 'index.html'), (err2, data2) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data2);
      });
      return;
    }
    const mime = MIME[path.extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}
