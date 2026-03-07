import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { email, content } = await request.json();

    if (!email || !content) {
      return NextResponse.json({ error: 'Email and content required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert([{
        sender_email: email,
        recipient_email: 'admin@boanipa.com',
        body: content.trim(),
        subject: '',
        is_read: false,
      }])
      .select();

    if (error) {
      console.error('Error sending message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: data[0] });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}