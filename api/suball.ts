import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  // Simple detection for non-client access
  const isBrowser = /Mozilla|Chrome|Safari|Firefox|Edge/.test(userAgent) && !/v2ray|hiddify|vless|shadowsocks|clash|nekobox|streisand|quantumult|surge/i.test(userAgent);

  if (isBrowser) {
    const subUrl = `https://vlessfree.vercel.app/suball`;
    const qrCodeImageUrl = 'https://i.ibb.co/7J85dCT8/Untitled.png';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`
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
  
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Profile-Title', 'vlessfree Sub');
  res.setHeader('Profile-Web-Page-Url', 'https://vlessfree.vercel.app');
  
  return res.status(200).send(base64Content);
}
