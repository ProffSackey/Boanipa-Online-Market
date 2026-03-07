import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';

/**
 * GET /api/customer-orders?email=user@example.com
 * Fetch orders for a specific customer email
 * Public endpoint - anyone can query, but should verify session in frontend
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service role not configured' },
        { status: 500 }
      );
    }

    // Fetch orders for the customer using case-insensitive comparison
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .ilike('customer_email', email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Transform and format the response
    const formattedOrders = (orders || []).map(order => ({
      id: order.order_number || order.id,
      order_number: order.order_number || order.id,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      items: order.items || [],
      total_amount: order.total_amount || 0,
      status: order.status || 'pending',
      payment_status: order.payment_status || 'pending',
      created_at: order.created_at,
      updated_at: order.updated_at,
      shipping_address: order.shipping_address,
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Customer orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
