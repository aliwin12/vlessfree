import { MOCK_KEYS } from '../src/data/keys.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const configs = MOCK_KEYS.map(k => k.config).join('\n');
  const base64Content = Buffer.from(configs).toString('base64');
  
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Profile-Title', 'vlessfree Sub');
  res.setHeader('Profile-Web-Page-Url', 'https://vlessfree.vercel.app');
  
  return res.status(200).send(base64Content);
}
