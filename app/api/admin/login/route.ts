import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // use Supabase Auth to verify credentials
    const { data: signInData, error: signInError } =
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, password, apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string }),
      }).then((r) => r.json());

    if (signInError || !signInData?.access_token) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // optionally check that the user is an admin via metadata or admins table
    // we assume any authenticated user reaching this route will be an admin

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
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
