import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '../../../../lib/supabaseClient';
import { createCustomer } from '../../../../lib/supabaseService';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      );
    }

    // Create customer record in database
    const customer = await createCustomer({
      id: authData.user.id,
      email: email,
      name: name || email.split('@')[0], // Use provided name or extract from email
      phone: '',
      address: {},
      total_orders: 0,
      total_spent: 0,
      is_active: true,
    });

    if (!customer) {
      console.warn('Customer record created in auth but failed to create customer profile');
      // Don't fail here - auth user was created successfully
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      message: 'Account created! Check your email to verify.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
