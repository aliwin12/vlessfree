import { MOCK_KEYS } from '../src/data/keys.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userAgent = req.headers['user-agent'] || '';
  const configs = MOCK_KEYS.map(k => k.config).join('\n');
  const base64Content = Buffer.from(configs).toString('base64');

  // Simple detection for non-client access
  const isBrowser = /Mozilla|Chrome|Safari|Firefox|Edge/.test(userAgent) && !/v2ray|hiddify|vless|shadowsocks|clash|nekobox|streisand|quantumult|surge/i.test(userAgent);

  if (isBrowser) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>vlessfree Sub✅</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
          .card { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 32px; padding: 40px; max-width: 400px; width: 100%; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
          h1 { font-style: italic; font-weight: normal; margin-bottom: 24px; font-size: 24px; }
          p { color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 32px; line-height: 1.6; }
          .btn { display: block; width: 100%; padding: 16px; margin-bottom: 12px; border-radius: 16px; border: none; font-weight: bold; cursor: pointer; text-decoration: none; transition: all 0.3s; box-sizing: border-box; font-size: 14px; }
          .btn-primary { background: #fff; color: #000; }
          .btn-primary:hover { background: rgba(255,255,255,0.9); transform: translateY(-2px); }
          .btn-outline { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.1); }
          .btn-outline:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); transform: translateY(-2px); }
          .copy-msg { font-size: 12px; color: #4ade80; margin-top: 8px; display: none; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>vlessfree Sub✅</h1>
          <p>Скопируйте ссылку и вставьте её в клиент или выберете приложение ниже для быстрого импорта:</p>
          
          <button class="btn btn-primary" onclick="copySubLink()">Скопировать ссылку подписки</button>
          <div id="copyMsg" class="copy-msg">Ссылка скопирована!</div>
          <p style="margin-top: 12px; margin-bottom: 0; font-size: 10px; color: rgba(255,255,255,0.3); font-style: italic;">* рекомендуем обновлять подписку, чтобы получать новые ключи удобнее</p>
          
          <div style="margin-top: 24px;">
            <a href="v2raytun://install-config?url=\${encodeURIComponent(req.headers.host ? 'https://' + req.headers.host + '/suball' : '')}" class="btn btn-outline">Импорт в v2rayTun</a>
            <a href="hiddify://install-config?url=\${encodeURIComponent(req.headers.host ? 'https://' + req.headers.host + '/suball' : '')}" class="btn btn-outline">Импорт в Hiddify</a>
            <a href="happ://install-config?url=\${encodeURIComponent(req.headers.host ? 'https://' + req.headers.host + '/suball' : '')}" class="btn btn-outline">Импорт в Happ</a>
          </div>

          <p style="margin-top: 32px; margin-bottom: 0; font-size: 10px;">https://vlessfree.vercel.app</p>
        </div>

        <script>
          function copySubLink() {
            const url = window.location.href;
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
