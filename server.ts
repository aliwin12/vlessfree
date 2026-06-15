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

function getSlug(text: string): string {
  const ru: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya'
  };
  const transliterated = (text || '')
    .toLowerCase()
    .split('')
    .map(char => ru[char] !== undefined ? ru[char] : char)
    .join('');

  const slug = transliterated
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'sub';
}

function checkIsBrowser(req: express.Request): boolean {
  const userAgent = req.headers['user-agent'] || '';
  const acceptHeader = req.headers['accept'] || '';
  
  const hasBrowserUa = /Mozilla|Chrome|Safari|Firefox|Edge/.test(userAgent) && 
                       !/v2ray|hiddify|vless|shadowsocks|clash|nekobox|streisand|quantumult|surge|shadowrocket|loon|stash|kitsunebi|matsuri|sing-box|singbox|surfboard|bifrost|anxray|trojan|hysteria|ss/i.test(userAgent);
  
  const wantsHtml = acceptHeader.includes('text/html');
  
  return hasBrowserUa && wantsHtml;
}

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
        const sName = getSlug(s.name || '');
        const reqSubName = getSlug(subName);
        
        return s.postType === 'subscription' && sUsername === username.toLowerCase().trim() && (sName === reqSubName || sName.includes(reqSubName) || reqSubName.includes(sName));
      });

      if (!foundSub) {
        return res.status(404).send('Subscription folders matching query not found.');
      }

      const targetUrl = (foundSub.config || '').trim();
      let rawText = '';

      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
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

        rawText = await response.text();
      } else {
        // Fallback if they pasted configurations directly instead of a link
        rawText = targetUrl;
      }

      let unpackedText = rawText;

      // Base64 decoding fallback if response is encrypted/base64 encoded
      let isBase64 = false;
      const cleanedText = rawText.trim().replace(/[\s\n\r]/g, '');
      const hasProto = cleanedText.includes('://');

      if (!hasProto && cleanedText.length > 10) {
        // Base64 regex allowing standard and URL-safe characters, and padding
        const base64Regex = /^[a-zA-Z0-9+/=\-_]+$/;
        if (base64Regex.test(cleanedText)) {
          isBase64 = true;
        }
      }

      if (isBase64) {
        try {
          // Normalize URL-safe Base64 to standard Base64
          let standardBase64 = cleanedText
            .replace(/-/g, '+')
            .replace(/_/g, '/');
          
          while (standardBase64.length % 4 !== 0) {
            standardBase64 += '=';
          }
          
          unpackedText = Buffer.from(standardBase64, 'base64').toString('utf-8');
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
        let originalTag = '';
        if (configStr.includes('#')) {
          const parts = configStr.split('#');
          configWithoutTag = parts[0];
          originalTag = parts.slice(1).join('#');
        }

        let decodedTag = '';
        if (originalTag) {
          try {
            decodedTag = decodeURIComponent(originalTag).trim();
          } catch (e) {
            decodedTag = originalTag.trim();
          }
        }

        // Determine protocol label
        let protoLabel = 'VLESS';
        const lowerConfig = configStr.toLowerCase();
        if (lowerConfig.startsWith('vmess://')) protoLabel = 'VMess';
        else if (lowerConfig.startsWith('ss://')) protoLabel = 'Shadowsocks';
        else if (lowerConfig.startsWith('ssr://')) protoLabel = 'SSR';
        else if (lowerConfig.startsWith('trojan://')) protoLabel = 'Trojan';
        else if (lowerConfig.startsWith('hysteria2://') || lowerConfig.startsWith('hysteria://')) protoLabel = 'Hysteria2';
        else if (lowerConfig.startsWith('tuic://')) protoLabel = 'TUIC';

        // Extract host and SNI to check for location clues
        let host = '';
        let sni = '';
        try {
          const mainPart = configWithoutTag.substring(configWithoutTag.indexOf('://') + 3);
          const atIdx = mainPart.indexOf('@');
          let socketStr = atIdx !== -1 ? mainPart.substring(atIdx + 1) : mainPart;
          
          const qIdx = socketStr.indexOf('?');
          if (qIdx !== -1) {
            const paramsStr = socketStr.substring(qIdx + 1);
            socketStr = socketStr.substring(0, qIdx);
            
            const params = paramsStr.split('&');
            for (const p of params) {
              if (p.toLowerCase().startsWith('sni=')) {
                sni = p.substring(4);
              }
            }
          }
          
          const colonIdx = socketStr.lastIndexOf(':');
          host = colonIdx !== -1 ? socketStr.substring(0, colonIdx) : socketStr;
        } catch (e) {
          // ignore
        }

        // Match country using keyword scanning
        const searchPool = `${decodedTag} ${host} ${sni}`.toLowerCase();
        
        const countriesReference = [
          { keywords: ['singapore', 'сингапур', 'sg', '🇸🇬'], flag: '🇸🇬', nameRu: 'Сингапур' },
          { keywords: ['usa', 'сша', 'america', 'united states', 'new york', 'ny', 'us', '🇺🇸'], flag: '🇺🇸', nameRu: 'США' },
          { keywords: ['germany', 'германия', 'de', 'frankfurt', '🇩🇪'], flag: '🇩🇪', nameRu: 'Германия' },
          { keywords: ['netherlands', 'нидерланды', 'amsterdam', 'nl', '🇳🇱', 'neth'], flag: '🇳🇱', nameRu: 'Нидерланды' },
          { keywords: ['finland', 'финляндия', 'fi', 'helsinki', '🇫🇮'], flag: '🇫🇮', nameRu: 'Финляндия' },
          { keywords: ['poland', 'польша', 'pl', 'warsaw', 'warszawa', '🇵🇱'], flag: '🇵🇱', nameRu: 'Польша' },
          { keywords: ['france', 'франция', 'fr', 'paris', '🇫🇷'], flag: '🇫🇷', nameRu: 'Франция' },
          { keywords: ['turkey', 'турция', 'tr', 'istanbul', '🇹🇷'], flag: '🇹🇷', nameRu: 'Турция' },
          { keywords: ['japan', 'япония', 'jp', 'tokyo', '🇯🇵'], flag: '🇯🇵', nameRu: 'Япония' },
          { keywords: ['russia', 'россия', 'ru', 'moscow', 'мск', '🇷🇺'], flag: '🇷🇺', nameRu: 'Россия' },
          { keywords: ['ukraine', 'украина', 'ua', 'kyiv', 'киев', '🇺🇦'], flag: '🇺🇦', nameRu: 'Украина' },
          { keywords: ['kazakhstan', 'казахстан', 'kz', 'almaty', 'алматы', '🇰🇿'], flag: '🇰🇿', nameRu: 'Казахстан' },
          { keywords: ['united kingdom', 'london', 'gb', 'uk', 'англия', 'великобритания', '🇬🇧', 'britain'], flag: '🇬🇧', nameRu: 'Великобритания' },
          { keywords: ['sweden', 'швеция', 'se', 'stockholm', '🇸🇪'], flag: '🇸🇪', nameRu: 'Швеция' },
          { keywords: ['switzerland', 'швейцария', 'ch', 'zurich', '🇨🇭'], flag: '🇨🇭', nameRu: 'Швейцария' },
          { keywords: ['austria', 'австрия', 'at', 'vienna', '🇦🇹'], flag: '🇦🇹', nameRu: 'Австрия' },
          { keywords: ['spain', 'испания', 'es', 'madrid', '🇪🇸'], flag: '🇪🇸', nameRu: 'Испания' },
          { keywords: ['italy', 'италия', 'it', 'milan', 'roma', '🇮🇹'], flag: '🇮🇹', nameRu: 'Италия' },
          { keywords: ['canada', 'канада', 'ca', 'toronto', '🇨🇦'], flag: '🇨🇦', nameRu: 'Канада' },
          { keywords: ['hong kong', 'гонконг', 'hk', '🇭🇰'], flag: '🇭🇰', nameRu: 'Гонконг' }
        ];

        let matched = countriesReference.find(c => {
          return c.keywords.some(kw => searchPool.includes(kw));
        });

        let geoPrefix = '🌐 Global';
        if (matched) {
          geoPrefix = `${matched.flag} ${matched.nameRu}`;
        } else if (decodedTag) {
          // Keep original tag partially if it has non-empty text, truncating extreme length
          geoPrefix = decodedTag.replace(/[|#@]/g, '').trim().substring(0, 24);
        }

        const customTagName = `${geoPrefix} | ${protoLabel} | от @${username} [${idx + 1}]`;
        return `${configWithoutTag}#${encodeURIComponent(customTagName)}`;
      }).join('\n');

      const reqHost = req.headers.host ? `${req.protocol}://${req.headers.host}` : 'https://vlessfree.vercel.app';
      
      const safeTitleName = getSlug(foundSub.name || 'sub').replace(/-/g, ' ');
      const safeTitle = `${safeTitleName} | by @${foundSub.username} | vlessfree`;
      
      // Always return plain text list of renamed configs directly without any HTML interface
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Profile-Title', safeTitle); 
      res.setHeader('Profile-Update-Interval', '6');
      res.setHeader('Profile-Web-Page-Url', encodeURI(`${reqHost}/user/${foundSub.username}`));
      return res.send(formattedConfigs);
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

    const configs = servers.filter(s => s && s.status === 'online' && s.config && !s.isUserPost).map(s => {
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

    const isBrowser = checkIsBrowser(req);
    const reqHost = req.headers.host ? `${req.protocol}://${req.headers.host}` : 'https://vlessfree.vercel.app';

    if (isBrowser) {
      const subUrl = `${reqHost}/suball`;
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

            <p style="margin-top: 40px; margin-bottom: 0; font-size: 10px; opacity: 0.3;">${reqHost}</p>
          </div>

          <script>
            function copySubLink() {
              const url = "${subUrl}";
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
    res.setHeader('Profile-Web-Page-Url', reqHost);
    
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
