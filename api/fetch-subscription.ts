export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing subscription URL parameter' });
  }

  try {
    console.log(`Fetching subscription URL: ${url}`);
    
    // Fetch target URL with client headers
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
    return res.status(200).json({ content: text });
  } catch (error: any) {
    console.error("Failed to fetch subscription:", error);
    return res.status(500).json({ error: error.message || 'Internal connection error' });
  }
}
