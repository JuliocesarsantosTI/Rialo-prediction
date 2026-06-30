// Vercel serverless function: POST /api/ask  { question }
// Docs-grounded, stateless. Uses Groq (OpenAI-compatible). The API key lives only
// here as a Vercel Environment Variable — never in the frontend.

const fs = require('fs');
const path = require('path');
let DOCS = '';
try { DOCS = fs.readFileSync(path.join(__dirname, 'rialo-docs.txt'), 'utf8'); }
catch (e) { console.error('docs read failed:', e && e.message); }

const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const PER_IP_PER_MIN = parseInt(process.env.ASK_PER_IP_PER_MIN || '5', 10);
const PER_IP_PER_DAY = parseInt(process.env.ASK_PER_IP_PER_DAY || '40', 10);

const SYSTEM_PROMPT = `You are the Rialo documentation assistant.
Answer the user's question using ONLY the Rialo documentation provided below.
Rules:
- If the answer is not in the documentation, say you don't know and suggest checking the official Rialo docs at https://rialo.io/docs. Never guess or use outside knowledge.
- Only answer questions about Rialo. If asked anything unrelated, politely say you only cover Rialo.
- Be concise and clear. Plain text, no markdown headings.

--- RIALO DOCUMENTATION START ---
${DOCS}
--- RIALO DOCUMENTATION END ---`;

// Best-effort in-memory rate limit (per warm instance). Fine for low traffic.
const hits = new Map();
const nowMin = () => Math.floor(Date.now() / 60000);
const today = () => Math.floor(Date.now() / 86400000);
function rateOk(ip) {
  const m = nowMin(), d = today();
  let u = hits.get(ip);
  if (!u) { u = { m, mc: 0, d, dc: 0 }; hits.set(ip, u); }
  if (u.m !== m) { u.m = m; u.mc = 0; }
  if (u.d !== d) { u.d = d; u.dc = 0; }
  if (u.mc >= PER_IP_PER_MIN) return 'Please wait a minute and try again.';
  if (u.dc >= PER_IP_PER_DAY) return "You've reached today's question limit. It resets tomorrow.";
  u.mc++; u.dc++; return null;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const key = process.env.GROQ_API_KEY;
  if (!key) { res.status(503).json({ error: 'Ask Rialo is not configured (missing GROQ_API_KEY).' }); return; }
  const NO_ANSWER = "I don't know based on the Rialo docs I have. You can check the official docs at https://rialo.io/docs.";
  if (DOCS.includes('PASTE YOUR RIALO DOCUMENTATION HERE')) {
    res.status(200).json({ answer: NO_ANSWER });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const limited = rateOk(ip);
  if (limited) { res.status(429).json({ error: limited }); return; }

  const body = await readBody(req);
  const question = String(body.question || '').trim();
  if (!question) { res.status(400).json({ error: 'Ask a question about Rialo.' }); return; }
  if (question.length > 1000) { res.status(400).json({ error: 'Question is too long.' }); return; }

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question },
        ],
      }),
    });

    const raw = await r.text();
    if (r.status === 429) { res.status(200).json({ answer: 'The assistant is rate-limited right now. Please try again shortly.' }); return; }
    if (!r.ok) {
      console.error('Groq error', r.status, raw.slice(0, 300));
      res.status(200).json({ answer: "I couldn't answer that right now. Please try again in a moment." });
      return;
    }

    let data;
    try { data = JSON.parse(raw); }
    catch (e) { console.error('Groq parse error', raw.slice(0, 300)); res.status(200).json({ answer: "I couldn't answer that right now. Please try again in a moment." }); return; }

    const answer = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim()
      || "I couldn't generate an answer. Try rephrasing your Rialo question.";
    res.status(200).json({ answer });
  } catch (e) {
    console.error('ask handler exception:', e && e.message);
    res.status(200).json({ answer: "I couldn't answer that right now. Please try again in a moment." });
  }
};
