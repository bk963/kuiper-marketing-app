/**
 * Gemeinsamer GEX44-Zugang (on-prem Ollama, DSGVO). JSON-Mode.
 * ENV: GEX44_URL, GEX44_USER, GEX44_PASS, GEX44_MODEL / GEX44_BRAIN_MODEL.
 */
export async function askGex44(prompt: string, opts?: { model?: string; timeoutMs?: number; numCtx?: number }): Promise<{ ok: boolean; raw?: string; error?: string }> {
  const url = process.env.GEX44_URL || 'https://gex44.kuiper-safety.de';
  const user = process.env.GEX44_USER || '';
  const pass = process.env.GEX44_PASS || '';
  const model = opts?.model || process.env.GEX44_BRAIN_MODEL || 'qwen2.5:14b';
  if (!user || !pass) return { ok: false, error: 'GEX44-Zugang nicht konfiguriert' };
  const auth = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
  try {
    const r = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      // num_ctx 16384: großer Signal-Prompt + vollständige JSON-Antwort passen rein,
      // sonst wird die Ausgabe abgeschnitten → "kein valides JSON" (Vorfall 2026-10-08 früh).
      body: JSON.stringify({ model, format: 'json', stream: false, prompt, options: { temperature: 0.3, num_ctx: opts?.numCtx ?? 16384 } }),
      signal: AbortSignal.timeout(opts?.timeoutMs ?? 240000),
    });
    if (!r.ok) return { ok: false, error: `GEX44 HTTP ${r.status}` };
    const d = await r.json();
    return { ok: true, raw: d.response || '' };
  } catch (e: any) {
    return { ok: false, error: e?.message?.slice(0, 160) || 'GEX44-Fehler' };
  }
}
