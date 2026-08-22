export default async function handler(req: any, res: any) {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).json({ error: 'Target stream URL is required' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Fast 302 Redirect directly to CDN stream so Vercel Serverless is not bottlenecked
  return res.redirect(302, decodeURIComponent(url));
}
