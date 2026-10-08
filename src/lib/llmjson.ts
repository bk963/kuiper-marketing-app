/**
 * Tolerantes JSON-Parsing für LLM-Antworten (GEX44 & Co).
 * Entfernt Code-Fences und extrahiert notfalls das äußerste {…}-Objekt.
 * Gibt null zurück, wenn nichts Brauchbares drin ist — Aufrufer entscheidet über Fehlerpfad.
 */
export function parseLlmJson<T = any>(raw?: string): T | null {
  if (!raw) return null;
  const s = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(s) as T; } catch { /* weiter */ }
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(s.slice(start, end + 1)) as T; } catch { /* */ }
  }
  return null;
}

/** Entfernt Dubletten aus einer Liste von Objekten anhand eines normalisierten Titel-Felds.
 *  Modelle neigen dazu, auf eine Zielzahl mit Varianten desselben Themas aufzufüllen. */
export function dedupeByTitle<T extends Record<string, any>>(items: T[], field = 'title', max = 10): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items || []) {
    const key = String(it?.[field] || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-zäöüß0-9]+/g, ' ').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key); out.push(it);
    if (out.length >= max) break;
  }
  return out;
}
