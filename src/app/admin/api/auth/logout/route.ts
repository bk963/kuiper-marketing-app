import { NextResponse } from 'next/server';
import { adminLogout } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  await adminLogout();
  const fwdHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const fwdProto = req.headers.get('x-forwarded-proto') || 'https';
  const base = fwdHost ? `${fwdProto}://${fwdHost}` : new URL(req.url).origin;
  return NextResponse.redirect(new URL('/admin/login', base), { status: 303 });
}
