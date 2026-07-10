// fashn-tryon — Supabase Edge Function proxying the FASHN virtual try-on API.
// The FASHN key lives ONLY here (function secret FASHN_API_KEY), never in the
// app bundle. verify_jwt is on by default → only signed-in WEROL users can
// call it (the app invokes it with the user's session token).
//
// Deploy:   supabase functions deploy fashn-tryon
// Secret:   supabase secrets set FASHN_API_KEY=fa-...
//
// POST { model_image, garment_image, category: 'tops'|'bottoms'|'one-pieces' }
// → { output: string }  |  { error: string }

const FASHN_KEY = Deno.env.get('FASHN_API_KEY') ?? '';
const BASE = 'https://api.fashn.ai/v1';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
    if (!FASHN_KEY) return json({ error: 'FASHN_API_KEY secret not set' }, 500);

    const { model_image, garment_image, category } = await req.json();
    if (!model_image || !garment_image || !['tops', 'bottoms', 'one-pieces'].includes(category)) {
      return json({ error: 'model_image, garment_image and a valid category are required' }, 400);
    }

    // Kick off the try-on run
    const run = await fetch(`${BASE}/run`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${FASHN_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_name: 'tryon-v1.6',
        inputs: { model_image, garment_image, category },
      }),
    });
    const started = await run.json();
    if (!run.ok || !started.id) {
      return json({ error: started?.error?.message ?? `FASHN run failed (${run.status})` }, 502);
    }

    // Poll until done (~5–17 s typically)
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const st = await fetch(`${BASE}/status/${started.id}`, {
        headers: { Authorization: `Bearer ${FASHN_KEY}` },
      });
      const s = await st.json();
      if (s.status === 'completed' && s.output?.[0]) return json({ output: s.output[0] });
      if (s.status === 'failed') return json({ error: s?.error?.message ?? 'Generation failed' }, 502);
    }
    return json({ error: 'Generation timed out' }, 504);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
