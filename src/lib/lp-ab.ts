/**
 * LP-A/B-Routing-Helper für Public-Route.
 *
 * Cookie-Modell:
 *  - Name: lp_ab_<slug>
 *  - Wert: "a" | "b"
 *  - Set bei first-visit (50/50-Split)
 *  - Sticky für gleichen User (Lifetime 30d)
 *
 * Render-Pfade:
 *  - Variant A (default): content_json.sections
 *  - Variant B: ab_variant_b.sections
 *
 * View-Increment via Fire-and-Forget PATCH zur Marketing-PB.
 */
import { cookies } from 'next/headers';

const COOKIE_PREFIX = 'lp_ab_';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 Tage

export type Variant = 'a' | 'b';

/**
 * Variant für aktuelle Request bestimmen.
 * Setzt Cookie bei first-visit.
 */
export async function resolveVariant(slug: string, abTestActive: boolean): Promise<Variant> {
  if (!abTestActive) return 'a';

  const ck = await cookies();
  const cookieName = COOKIE_PREFIX + slug;
  const existing = ck.get(cookieName)?.value;

  if (existing === 'a' || existing === 'b') return existing;

  // First visit — 50/50
  const variant: Variant = Math.random() < 0.5 ? 'a' : 'b';
  try {
    ck.set(cookieName, variant, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: false, // Client-readable für Tracking-Korrelation
      sameSite: 'lax',
      path: '/',
    });
  } catch {
    // server-component-cookie-set kann werfen in static contexts
  }
  return variant;
}

/**
 * Variant-spezifische Sections aus LP-Record extrahieren.
 */
export function pickSections(lp: any, variant: Variant) {
  if (variant === 'b' && lp.ab_variant_b?.sections) {
    return lp.ab_variant_b.sections;
  }
  return lp.content_json?.sections || [];
}

/**
 * View-Counter Fire-and-Forget.
 * Holt PB-Superuser-Token + PATCHs +1 auf ab_views_a/b.
 *
 * Hinweis: Race-Condition möglich bei high traffic — für jetzt akzeptiert.
 * Bei Volume >100/s wäre ein dedizierter Counter-Service nötig.
 */
export async function incrementView(lpId: string, variant: Variant): Promise<void> {
  const pbUrl = process.env.MPB_URL || 'https://pb.kuiper-safety.de';
  const email = process.env.PB_BLOG_EMAIL || process.env.PB_SUPERUSER_EMAIL || '';
  const pass = process.env.PB_BLOG_PASS || process.env.PB_SUPERUSER_PASS || '';
  if (!email || !pass) return;

  const cfId = process.env.PB_CF_ACCESS_CLIENT_ID || '';
  const cfSecret = process.env.PB_CF_ACCESS_CLIENT_SECRET || '';
  const cfHeaders: Record<string, string> = {};
  if (cfId && cfSecret) {
    cfHeaders['CF-Access-Client-Id'] = cfId;
    cfHeaders['CF-Access-Client-Secret'] = cfSecret;
  }

  try {
    // 1. Token holen
    const authRes = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cfHeaders },
      body: JSON.stringify({ identity: email, password: pass }),
      cache: 'no-store',
    });
    if (!authRes.ok) return;
    const { token } = await authRes.json();
    if (!token) return;

    // 2. Aktuellen LP-Record fetchen für Counter-Wert (race-acceptable)
    const getRes = await fetch(`${pbUrl}/api/collections/mkt_landingpages/records/${lpId}?fields=ab_views_a,ab_views_b`, {
      headers: { Authorization: token, ...cfHeaders },
      cache: 'no-store',
    });
    if (!getRes.ok) return;
    const lp = await getRes.json();

    // 3. Counter +1 PATCHEN
    const field = variant === 'a' ? 'ab_views_a' : 'ab_views_b';
    const currentValue = Number(lp[field] || 0);
    await fetch(`${pbUrl}/api/collections/mkt_landingpages/records/${lpId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: token, ...cfHeaders },
      body: JSON.stringify({ [field]: currentValue + 1 }),
    });
  } catch {
    // Fire-and-Forget — silent fail
  }
}
