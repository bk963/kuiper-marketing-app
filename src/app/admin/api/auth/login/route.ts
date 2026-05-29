import { NextResponse } from 'next/server';
import { adminLogin } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public-URL aus den Forwarded-Headers bauen.
 * Hinter Cloudflare/Coolify ist req.url = http://localhost:3200 (Container intern),
 * deshalb müssen wir x-forwarded-proto + x-forwarded-host nutzen.
 */
function publicUrl(req: Request, path: string): URL {
  const fwdHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const fwdProto = req.headers.get('x-forwarded-proto') || 'https';
  const base = fwdHost ? `${fwdProto}://${fwdHost}` : new URL(req.url).origin;
  return new URL(path, base);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get('email') || '');
  const password = String(form.get('password') || '');
  const res = await adminLogin(email, password);
  if (!res.ok) {
    const url = publicUrl(req, '/admin/login');
    url.searchParams.set('error', res.error);
    return NextResponse.redirect(url, { status: 303 });
  }
  return NextResponse.redirect(publicUrl(req, '/admin'), { status: 303 });
}
