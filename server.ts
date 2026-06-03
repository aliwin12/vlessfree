import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Sitemap endpoint
  app.get('/sitemap.xml', (req, res) => {
    res.setHeader('Content-Type', 'application/xml');
    res.sendFile(path.join(process.cwd(), 'public', 'sitemap.xml'));
  });

  // Robots.txt endpoint
  app.get('/robots.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.sendFile(path.join(process.cwd(), 'public', 'robots.txt'));
  });

  // Versions Android Plain Text endpoint
  app.get(['/versionsandroid', '/api/versionsandroid'], async (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    let versionText = 'v0.1 ok';
    try {
      const docRef = doc(db, 'settings', 'versionsandroid');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && typeof data.value === 'string') {
          versionText = data.value;
        }
      }
    } catch (error) {
      console.error("Error loading versionsandroid server-side:", error);
    }
    res.send(versionText);
  });

  // Proxy endpoint to fetch subscription urls (to avoid CORS)
  app.get('/api/fetch-subscription', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing subscription URL parameter' });
    }

    try {
      console.log(`Fetching subscription URL: ${url}`);
      // Native fetch in Node 18+
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'v2rayN/Telegram@vlessfree',
          'Accept': '*/*'
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Failed to fetch from target URL. Status: ${response.status}` });
      }

      const text = await response.text();
      return res.json({ content: text });
    } catch (error: any) {
      console.error("Failed to fetch subscription:", error);
      return res.status(500).json({ error: error.message || 'Internal connection error' });
    }
  });

  // Dynamic endpoint to resolve user-specific folder subscriptions
  app.get('/:username/:subName', async (req, res, next) => {
    const { username, subName } = req.params;

    // Skip reserved system paths, layout assets, and route definitions to prevent interference
    const reserved = ['api', 'public', 'assets', 'suball', 'sitemap.xml', 'robots.txt', 'versionsandroid', 'remove-server', 'suggest-server', 'index.html', 'user', 'static', 'vite', 'special', '@id', '@vite', '@fs', '@react-refresh', 'src'];
    if (reserved.includes(username.toLowerCase())) {
      return next();
    }

    try {
      console.log(`Resolving user-specific subscription. Author: ${username}, Subscription slugs: ${subName}`);
      
      const serversSnap = await getDocs(collection(db, 'servers'));
      const foundSub = serversSnap.docs.map(d => ({ id: d.id, ...d.data() as any })).find(s => {
        const sUsername = (s.username || '').toLowerCase().trim();
        const sName = (s.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
        const reqSubName = subName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
        
        return s.postType === 'subscription' && sUsername === username.toLowerCase().trim() && (sName === reqSubName || sName.includes(reqSubName) || reqSubName.includes(sName));
      });

      if (!foundSub) {
        return res.status(404).send('Subscription folders matching query not found.');
      }

      const targetUrl = foundSub.config;
      if (!targetUrl || !targetUrl.startsWith('http')) {
        return res.status(400).send('Invalid underlying source subscription URL.');
      }

      // Download source subscription content
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'v2rayN/Telegram@vlessfree',
          'Accept': '*/*'
        }
      });

      if (!response.ok) {
        return res.status(500).send(`Unable to fetch underlying configurations: ${response.statusText}`);
      }

      const rawText = await response.text();
      let unpackedText = rawText;

      // Base64 decoding fallback if response is encrypted/base64 encoded
      const hasProto = rawText.includes('://');
      const isBase64 = /^[a-zA-Z0-9+/=\s\n\r]+$/.test(rawText) && rawText.trim().length > 10 && !hasProto;
      if (isBase64) {
        try {
          unpackedText = Buffer.from(rawText.replace(/[\s\n\r]/g, ''), 'base64').toString('utf-8');
        } catch (e) {
          console.error("Failed to decode base64 configs:", e);
        }
      }

      // Extract valid config lines
      const protocols = ['vless://', 'vmess://', 'ss://', 'ssr://', 'trojan://', 'hysteria://', 'hysteria2://', 'tuic://'];
      const lines = unpackedText.split(/[\r\n]+/).map(line => line.trim()).filter(line => {
        return protocols.some(proto => line.startsWith(proto));
      });

      // Format server names inside subscription client profile matching user specification
      const formattedConfigs = lines.map((configStr, idx) => {
        let configWithoutTag = configStr;
        if (configStr.includes('#')) {
          configWithoutTag = configStr.split('#')[0];
        }
        // Name format request: *название подписки* | от *имя пользователя* | vlessfree
        const customTagName = `${foundSub.name} | от @${foundSub.username} | vlessfree [${idx + 1}]`;
        return `${configWithoutTag}#${encodeURIComponent(customTagName)}`;
      }).join('\n');

      const userAgent = req.headers['user-agent'] || '';
      const isBrowser = /Mozilla|Chrome|Safari|Firefox|Edge/.test(userAgent) && !/v2ray|hiddify|vless|shadowsocks|clash|nekobox|streisand|quantumult|surge/i.test(userAgent);

      if (isBrowser) {
        const subUrl = `https://vlessfree.vercel.app/${username}/${subName}`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${foundSub.name} ✅ vlessfree</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
              .card { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 32px; padding: 40px; max-width: 800px; width: 100%; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
              h1 { font-style: italic; font-weight: normal; margin-bottom: 8px; font-size: 28px; letter-spacing: -0.02em; }
              .author { color: #6366f1; font-weight: bold; font-family: monospace; font-size: 14px; margin-bottom: 24px; }
              p { color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 32px; line-height: 1.6; }
              .container { display: flex; flex-direction: column; gap: 40px; }
              @media (min-width: 768px) {
                .container { flex-direction: row; align-items: flex-start; text-align: left; }
                .left-side { flex: 1; }
                .right-side { width: 240px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 40px; }
              }
              .btn { display: block; width: 100%; padding: 16px; margin-bottom: 12px; border-radius: 16px; border: none; font-weight: bold; cursor: pointer; text-decoration: none; transition: all 0.3s; box-sizing: border-box; font-size: 14px; text-align: center; }
              .btn-primary { background: #fff; color: #000; }
              .btn-primary:hover { background: rgba(255,255,255,0.9); transform: translateY(-2px); }
              .btn-outline { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.1); }
              .btn-outline:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); transform: translateY(-2px); }
              .copy-msg { font-size: 12px; color: #4ade80; margin-top: 8px; display: none; }
              .qr-label { font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 16px; text-align: center; }
              .qr-image { background: rgba(255,255,255,0.03); padding: 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
              .servers-preview { background: rgba(255,255,255,0.02); border-radius: 16px; padding: 16px; text-align: left; font-size: 11px; color: rgba(255,255,255,0.4); max-height: 150px; overflow-y: auto; font-family: monospace; margin-top: 24px; border: 1px solid rgba(255,255,255,0.05); }
              .servers-title { font-size: 10px; uppercase font-bold tracking-wider opacity-40 mb-2 block; }
            </style>
          </head>
          <body>
            <div class="card">
              <div style="display: flex; justify-content: center; margin-bottom: 32px; width: 100%;">
                <img src="https://i.ibb.co/WWRyGZcS/2026-04-24-203638-removebg-preview.png" alt="Logo" style="max-width: 150px; height: auto;">
              </div>
              
              <div class="container">
                <div class="left-side">
                  <h1>${foundSub.name}</h1>
                  <div class="author">Автор: @${foundSub.username}</div>
                  <p>Эта общая папка-подписка содержит <strong>${lines.length}</strong> настроенных VLESS/Reality серверов, распакованных и оптимизированных.</p>
                  
                  <button class="btn btn-primary" onclick="copySubLink()">Скопировать ссылку подписки</button>
                  <div id="copyMsg" class="copy-msg">Ссылка скопирована!</div>
                  
                  <div style="margin-top: 24px;">
                    <a href="v2raytun://import/${subUrl}" class="btn btn-outline">Импорт в v2rayTun</a>
                    <a href="hiddify://import/${subUrl}" class="btn btn-outline">Импорт в Hiddify</a>
                    <a href="happ://import/config?url=${subUrl}" class="btn btn-outline">Импорт в Happ</a>
                  </div>
                  
                  <div class="servers-preview">
                    <span class="servers-title">Внутри этой папки (${lines.length} серверов):</span>
                    ${lines.map((l, i) => `<div>[${i + 1}] ${l.split('://')[0]} - распакован и готов</div>`).slice(0, 10).join('')}
                    ${lines.length > 10 ? '<div>... и еще ' + (lines.length - 10) + ' серверов</div>' : ''}
                  </div>
                </div>
  
                <div class="right-side">
                  <div class="qr-image" id="qrcode-container">
                    <img id="qr-img" src="" alt="QR Code" style="width: 180px; height: 180px; display: block;">
                  </div>
                  <div class="qr-label">Сканируйте для импорта</div>
                  <div style="font-size: 9px; color: rgba(255,255,255,0.2); margin-top: 8px;">vlessfree Sub</div>
                </div>
              </div>
  
              <p style="margin-top: 40px; margin-bottom: 0; font-size: 10px; opacity: 0.3;">https://vlessfree.vercel.app</p>
            </div>
  
            <script>
              const link = "${subUrl}";
              document.getElementById('qr-img').src = "https://chart.api.getqr.me/?size=180x180&data=" + encodeURIComponent(link);
              
              function copySubLink() {
                navigator.clipboard.writeText(link).then(() => {
                  const msg = document.getElementById('copyMsg');
                  msg.style.display = 'block';
                  setTimeout(() => { msg.style.display = 'none'; }, 2000);
                });
              }
            </script>
          </body>
          </html>
        `);
      }

      // Encode custom format Base64 configs for vless client
      const base64Content = Buffer.from(formattedConfigs).toString('base64');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Profile-Title', `${foundSub.name} | от @${foundSub.username} | vlessfree`); 
      res.setHeader('Profile-Update-Interval', '6');
      res.setHeader('Profile-Web-Page-Url', `https://vlessfree.vercel.app/user/${foundSub.username}`);
      return res.send(base64Content);
    } catch (err: any) {
      console.error("Error serving user subscription endpoint", err);
      return res.status(500).send(`Subscription processing failed: ${err.message}`);
    }
  });

  // Subscription endpoint for VLESS clients
  app.get('/suball', async (req, res) => {
    let servers: any[] = [];
    try {
      const snapshot = await getDocs(collection(db, 'servers'));
      servers = snapshot.docs.map(doc => doc.data());
      
      // Natural sort by name numbers (1, 2, 3...)
      servers.sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        const matchA = nameA.match(/\d+/);
        const matchB = nameB.match(/\d+/);
        
        if (matchA && matchB) {
          const numA = parseInt(matchA[0]);
          const numB = parseInt(matchB[0]);
          if (numA !== numB) return numA - numB;
        }
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      });
    } catch (error) {
      console.error("Firestore error:", error);
    }

    const userAgent = req.headers['user-agent'] || '';

    const configs = servers.filter(s => s && s.status === 'online' && s.config).map(s => {
      let config = s.config;
      let displayName = s.name || 'Server';
      
      if (s.country || s.city) {
        const location = [s.country, s.city].filter(Boolean).join(', ');
        if (location) {
          displayName += ` / ${location}`;
        }
      }

      if (config.includes('#')) {
        config = config.split('#')[0] + '#' + encodeURIComponent(displayName);
      } else {
        config = config + '#' + encodeURIComponent(displayName);
      }
      return config;
    }).join('\n');

    const base64Content = Buffer.from(configs).toString('base64');

    // Simple detection for non-client access (browsers usually have "Mozilla" or specific browser names)
    const isBrowser = /Mozilla|Chrome|Safari|Firefox|Edge/.test(userAgent) && !/v2ray|hiddify|vless|shadowsocks|clash|nekobox|streisand|quantumult|surge/i.test(userAgent);

    if (isBrowser) {
      const subUrl = `https://vlessfree.vercel.app/suball`;
      const qrCodeImageUrl = 'https://i.ibb.co/7J85dCT8/Untitled.png';

      // Return a simple HTML page for humans
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>vlessfree Sub✅</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
            .card { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 32px; padding: 40px; max-width: 800px; width: 100%; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
            h1 { font-style: italic; font-weight: normal; margin-bottom: 24px; font-size: 24px; }
            p { color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 32px; line-height: 1.6; }
            .container { display: flex; flex-direction: column; gap: 40px; }
            @media (min-width: 768px) {
              .container { flex-direction: row; align-items: flex-start; text-align: left; }
              .left-side { flex: 1; }
              .right-side { width: 240px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 40px; }
            }
            .btn { display: block; width: 100%; padding: 16px; margin-bottom: 12px; border-radius: 16px; border: none; font-weight: bold; cursor: pointer; text-decoration: none; transition: all 0.3s; box-sizing: border-box; font-size: 14px; text-align: center; }
            .btn-primary { background: #fff; color: #000; }
            .btn-primary:hover { background: rgba(255,255,255,0.9); transform: translateY(-2px); }
            .btn-outline { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.1); }
            .btn-outline:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); transform: translateY(-2px); }
            .copy-msg { font-size: 12px; color: #4ade80; margin-top: 8px; display: none; }
            .qr-label { font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 16px; text-align: center; }
            .qr-image { background: rgba(255,255,255,0.03); padding: 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
          </style>
        </head>
        <body>
          <div class="card">
            <div style="display: flex; justify-content: center; margin-bottom: 32px; width: 100%;">
              <img src="https://i.ibb.co/WWRyGZcS/2026-04-24-203638-removebg-preview.png" alt="Logo" style="max-width: 150px; height: auto;">
            </div>
            
            <div class="container">
              <div class="left-side">
                <p>Скопируйте ссылку и вставьте её в клиент или выберите приложение ниже для быстрого импорта:</p>
                
                <button class="btn btn-primary" onclick="copySubLink()">Скопировать ссылку подписки</button>
                <div id="copyMsg" class="copy-msg">Ссылка скопирована!</div>
                
                <div style="margin-top: 24px;">
                  <a href="v2raytun://import/${subUrl}" class="btn btn-outline">Импорт в v2rayTun</a>
                  <a href="hiddify://import/${subUrl}" class="btn btn-outline">Импорт в Hiddify</a>
                  <a href="happ://import/config?url=${subUrl}" class="btn btn-outline">Импорт в Happ</a>
                </div>
                
                <p style="margin-top: 24px; margin-bottom: 0; font-size: 10px; color: rgba(255,255,255,0.3); font-style: italic;">* рекомендуем обновлять подписку регулярно</p>
              </div>

              <div class="right-side">
                <div class="qr-image">
                  <img src="${qrCodeImageUrl}" alt="QR Code" style="width: 180px; height: 180px; display: block; object-contain;">
                </div>
                <div class="qr-label">Сканируйте для импорта</div>
                <div style="font-size: 9px; color: rgba(255,255,255,0.2); margin-top: 8px;">vlessfree Sub</div>
              </div>
            </div>

            <p style="margin-top: 40px; margin-bottom: 0; font-size: 10px; opacity: 0.3;">https://vlessfree.vercel.app</p>
          </div>

          <script>
            function copySubLink() {
              const url = "https://vlessfree.vercel.app/suball";
              navigator.clipboard.writeText(url).then(() => {
                const msg = document.getElementById('copyMsg');
                msg.style.display = 'block';
                setTimeout(() => { msg.style.display = 'none'; }, 2000);
              });
            }
          </script>
        </body>
        </html>
      `);
    }

    // Standard subscription headers for clients
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
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
