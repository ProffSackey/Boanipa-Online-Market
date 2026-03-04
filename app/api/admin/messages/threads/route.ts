import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseClient';

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('sender_email, recipient_email, body, subject, is_read, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching message threads:', error);
      return NextResponse.json([], { status: 200 });
    }

    const map = new Map<string, any>();

    for (const m of data || []) {
      const sender: string = m.sender_email;
      if (!map.has(sender)) {
        const namePart = sender.split('@')[0] || sender;
        const initials = namePart
          .split(/[._-]/)
          .map((s: string) => (s && s[0] ? s[0].toUpperCase() : ''))
          .join('')
          .slice(0, 2);

        map.set(sender, {
          id: sender,
          name: namePart,
          email: sender,
          lastMessage: (m.body || m.subject || '').slice(0, 160),
          time: m.created_at,
          unread: 0,
          online: false,
          avatar: initials || sender.slice(0, 2).toUpperCase(),
          resolved: false,
        });
      }

      const thread = map.get(sender);
      if (m.is_read === false && m.recipient_email && m.recipient_email !== sender) {
        thread.unread = (thread.unread || 0) + 1;
      }
    }

    const threads = Array.from(map.values());
    return NextResponse.json(threads);
  } catch (err) {
    console.error('Failed to load threads:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
