import { createClient } from '@supabase/supabase-js';

const MODEL = 'qwen/qwen3.8-27b';
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 6;
const requests = new Map();

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

export default async function estimateWater(req, res) {
  if (req.method === 'GET') return res.status(200).json({ available: Boolean(process.env.GROQ_API_KEY) });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'Falta configurar GROQ_API_KEY en Vercel.' });

  const token = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '')?.[1];
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!token || !supabaseUrl || !anonKey) return res.status(401).json({ error: 'Inicia sesión para usar la estimación por foto.' });

  const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Tu sesión venció. Vuelve a entrar e inténtalo otra vez.' });

  const now = Date.now();
  const recent = (requests.get(user.id) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) return res.status(429).json({ error: 'Espera un minuto antes de estimar otra foto.' });

  const image = typeof req.body?.image === 'string' ? req.body.image : '';
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(image);
  if (!match || image.length > 1_800_000) return res.status(400).json({ error: 'La foto no es válida o pesa demasiado.' });

  const scoped = createClient(supabaseUrl, anonKey, {
    db: { schema: 'agualim' },
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await scoped.from('profiles').select('user_id').eq('user_id', user.id).maybeSingle();
  if (profileError || !profile) return res.status(403).json({ error: 'Esta cuenta no tiene un perfil de Agualin activo.' });

  requests.set(user.id, [...recent, now]);
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(25_000),
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: [
          { type: 'text', text: 'Estimate the amount of water currently inside the drinking glass or cup visible in this photo, in milliliters. Estimate the water present, not the container capacity. A single image cannot provide exact measurement; make a conservative visual estimate, rounded to the nearest 25 ml. If no drinking glass with visible water is present or the image does not allow a useful estimate, return estimated_ml as null. Return JSON only with estimated_ml (number or null), confidence (low, medium, or high), and reason (short Spanish sentence).' },
          { type: 'image_url', image_url: { url: image } },
        ] }],
        temperature: 0.2,
        max_completion_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    });
    if (!response.ok) return res.status(502).json({ error: 'Groq no pudo analizar la foto ahora. Inténtalo de nuevo.' });
    const result = await response.json();
    const raw = result.choices?.[0]?.message?.content;
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return res.status(502).json({ error: 'No pude leer la estimación. Inténtalo de nuevo.' }); }
    const ml = Number(parsed.estimated_ml);
    if (!Number.isFinite(ml) || ml < 50 || ml > 2500) return res.status(422).json({ error: parsed.reason || 'No pude distinguir el agua del vaso. Registra los mililitros manualmente.' });
    return res.status(200).json({ estimated_ml: Math.max(50, Math.min(2500, Math.round(ml / 25) * 25)), confidence: ['low', 'medium', 'high'].includes(parsed.confidence) ? parsed.confidence : 'low' });
  } catch (error) {
    return res.status(502).json({ error: error.name === 'TimeoutError' ? 'La estimación tardó demasiado. Inténtalo otra vez.' : 'No pude conectar con Groq. Inténtalo de nuevo.' });
  }
}
