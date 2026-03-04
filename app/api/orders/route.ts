import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';

/**
 * POST /api/orders
 * Create a new order with items and shipping information
 * Includes shipping fee in the total amount
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      customer_name,
      customer_email,
      customer_phone,
      items,
      total_amount,
      shipping_address,
      shipping_fee,
      status = 'pending',
    } = body;

    // Validate required fields
    if (!customer_name || !customer_email || !items || !total_amount) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, customer_email, items, total_amount' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items must be a non-empty array' },
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

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order in database
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        total_amount: parseFloat(String(total_amount)),
        status,
        payment_status: 'unpaid',
        items,
        shipping_address: shipping_address || null,
      })
      .select();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Also create/update customer record
    try {
      const { data: existingCustomer } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('email', customer_email)
        .single();

      if (existingCustomer) {
        // Update existing customer
        await supabaseAdmin
          .from('customers')
          .update({
            total_orders: (existingCustomer.total_orders || 0) + 1,
            total_spent: (existingCustomer.total_spent || 0) + parseFloat(String(total_amount)),
            phone: customer_phone || existingCustomer.phone,
            address: shipping_address || existingCustomer.address,
          })
          .eq('email', customer_email);
      } else {
        // Create new customer
        await supabaseAdmin
          .from('customers')
          .insert({
            email: customer_email,
            name: customer_name,
            phone: customer_phone || null,
            address: shipping_address || null,
            total_orders: 1,
            total_spent: parseFloat(String(total_amount)),
            is_active: true,
          });
      }
    } catch (err) {
      console.warn('Error updating customer record:', err);
      // Don't fail the order creation if customer update fails
    }

    return NextResponse.json(
      {
        success: true,
        order_number: orderNumber,
        order_id: order?.[0]?.id,
        total_amount,
        shipping_fee: shipping_fee || 0,
        message: 'Order created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
