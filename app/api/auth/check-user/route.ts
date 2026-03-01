import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Admin client not available' },
        { status: 500 }
      );
    }

    // Check if user exists
    const { data, error } = await supabaseAdmin
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected
      return NextResponse.json(
        { error: 'Failed to check user' },
        { status: 500 }
      );
    }

    const exists = !!data;

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
