import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // If ADMIN_EMAIL and ADMIN_PASSWORD are set, allow local env-based auth
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    console.log('[LOGIN] Email from request:', email);
    console.log('[LOGIN] Admin email from env:', adminEmail);
    console.log('[LOGIN] Email match:', email === adminEmail);
    console.log('[LOGIN] Admin password exists:', !!adminPassword);

    if (adminEmail && adminPassword && email === adminEmail) {
      console.log('[LOGIN] Checking password...');
      const ok = password === adminPassword;
      console.log('[LOGIN] Password match:', ok);
      
      if (!ok) {
        console.log('[LOGIN] Password mismatch');
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
    
    console.log('[LOGIN] Supabase response status:', tokenRes.status);
    console.log('[LOGIN] Supabase response:', signInJson);

    if (!tokenRes.ok || !signInJson?.access_token) {
      console.log('[LOGIN] Auth failed for email:', email);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const accessToken = signInJson?.access_token ?? '';
    const refreshToken = signInJson?.refresh_token ?? '';
    console.log('[LOGIN] Setting cookies with accessToken:', !!accessToken, 'refreshToken:', !!refreshToken);
    
    const res = NextResponse.json({ 
      ok: true,
      accessToken: accessToken, // Return token so client can send it as fallback
      refreshToken: refreshToken, // supply refresh token for client session
    });
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

    console.log('[LOGIN] admin_session cookie set');
    console.log('[LOGIN] Cookies after setting:', res.cookies.getAll().map(c => c.name));

    // also set sb-admin-token so server-side admin routes that check for
    // this cookie (existing code) see the Supabase access token
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
      console.log('[LOGIN] sb-admin-token cookie set');
      console.log('[LOGIN] Cookies now:', res.cookies.getAll().map(c => c.name));
    } else {
      console.log('[LOGIN] No access token to set sb-admin-token cookie');
    }

    console.log('[LOGIN] Login successful for:', email);
    return res;
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
