import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { MOCK_KEYS } from './src/data/keys.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Subscription endpoint for VLESS clients
  app.get('/suball', (req, res) => {
    const configs = MOCK_KEYS.map(k => k.config).join('\n');
    const base64Content = Buffer.from(configs).toString('base64');
    
    // Standard subscription headers
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    // Using ASCII for headers to avoid ERR_INVALID_CHAR while keeping it readable for clients
    res.setHeader('Profile-Title', 'vlessfree Sub'); 
    res.setHeader('Profile-Web-Page-Url', 'https://vlessfree.vercel.app');
    
    res.send(base64Content);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
