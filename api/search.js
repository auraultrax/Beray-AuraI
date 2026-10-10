function parseBody(body) { if (typeof body === 'string') return JSON.parse(body); return body && typeof body === 'object' ? body : {}; }
function safeHttpUrl(value) { try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) ? u.toString() : null; } catch { return null; } }
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Bu HTTP yöntemi desteklenmiyor.' });
  try {
    const body = parseBody(req.body); const query = String(body.query || '').trim().slice(0, 400);
    if (!query) return res.status(400).json({ error: 'Aranacak metni yaz.' });
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    const braveKey = process.env.BRAVE_SEARCH_API_KEY?.trim();
    if (braveKey) {
      const url = new URL('https://api.search.brave.com/res/v1/web/search'); url.searchParams.set('q', query); url.searchParams.set('country', 'TR'); url.searchParams.set('search_lang', 'tr'); url.searchParams.set('count', '5');
      const response = await fetch(url, { headers: { 'X-Subscription-Token': braveKey, Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error(`Brave arama hatası (${response.status}).`);
      const data = await response.json(); const results = (data.web?.results || []).slice(0, 5).map(x => ({ title: String(x.title || 'Başlıksız').slice(0, 250), url: safeHttpUrl(x.url), snippet: String(x.description || '').slice(0, 1200) })).filter(x => x.url);
      return res.status(200).json({ provider: 'Brave Search', results, googleUrl });
    }
    const tavilyKey = process.env.TAVILY_API_KEY?.trim();
    if (tavilyKey) {
      const response = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tavilyKey}` }, body: JSON.stringify({ query, search_depth: 'basic', topic: 'general', max_results: 5, include_answer: false }), signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error(`Tavily arama hatası (${response.status}).`);
      const data = await response.json(); const results = (data.results || []).slice(0, 5).map(x => ({ title: String(x.title || 'Başlıksız').slice(0, 250), url: safeHttpUrl(x.url), snippet: String(x.content || '').slice(0, 1200) })).filter(x => x.url);
      return res.status(200).json({ provider: 'Tavily', results, googleUrl });
    }
    return res.status(200).json({ provider: null, results: [], googleUrl, needsApiKey: true });
  } catch (e) { return res.status(502).json({ error: String(e.message || 'Arama başarısız.').slice(0, 350) }); }
}
