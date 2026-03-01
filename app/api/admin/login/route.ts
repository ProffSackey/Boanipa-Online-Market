import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // If ADMIN_EMAIL and ADMIN_PASSWORD_HASH are set, allow local env-based auth
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminHash = process.env.ADMIN_PASSWORD_HASH;

    if (adminEmail && adminHash && email === adminEmail) {
      const ok = await bcrypt.compare(password, adminHash);
      if (!ok) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const res = NextResponse.json({ ok: true });
      res.cookies.set({
        name: 'admin_session',
        value: 'authenticated',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
    }

    // Fallback to Supabase Auth token endpoint to verify credentials
    const tokenRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        },
        body: new URLSearchParams({ email, password }),
      }
    );

    const signInJson = await tokenRes.json();

    if (!tokenRes.ok || !signInJson?.access_token) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    // set simple admin session flag
    res.cookies.set({
      name: 'admin_session',
      value: 'authenticated',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    // also set sb-admin-token so server-side admin routes that check for
    // this cookie (existing code) see the Supabase access token
    const accessToken = signInJson?.access_token ?? '';
    if (accessToken) {
      res.cookies.set({
        name: 'sb-admin-token',
        value: accessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return res;
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
