import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true, message: 'Admin logged out' });
  res.cookies.set({
    name: 'admin_session',
    value: '',
    maxAge: 0,
    path: '/',
  });
  return res;
}
