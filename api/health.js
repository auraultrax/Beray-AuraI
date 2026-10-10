export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Bu HTTP yöntemi desteklenmiyor.' });
  const apiConfigured = Boolean(process.env.ZAI_API_KEY?.trim());
  return res.status(200).json({
    app: 'AURAI', version: '0.3.0', provider: 'Z.AI',
    model: process.env.ZAI_MODEL || 'glm-4.6',
    apiConfigured,
    webSearchConfigured: Boolean(process.env.BRAVE_SEARCH_API_KEY?.trim() || process.env.TAVILY_API_KEY?.trim() || apiConfigured)
  });
}
