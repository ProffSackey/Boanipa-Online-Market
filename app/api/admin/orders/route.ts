import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';

/**
 * GET /api/admin/orders
 * Fetch all orders for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service role not configured' },
        { status: 500 }
      );
    }

    // Fetch orders with customer info
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        total_amount,
        status,
        payment_status,
        items,
        shipping_address,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedOrders = await Promise.all(orders.map(async (order) => {
      // Fetch product details for each item
      const itemsWithDetails = await Promise.all(
        (order.items || []).map(async (item: any) => {
          try {
            const { data: productData } = await supabaseAdmin
              .from('products')
              .select('name, image_url')
              .eq('id', item.product_id || item.productId)
              .single();

            return {
              productId: item.product_id || item.productId,
              quantity: item.quantity || 1,
              price: item.price || 0,
              name: productData?.name || undefined,
              image: productData?.image_url || undefined,
            };
          } catch {
            return {
              productId: item.product_id || item.productId,
              quantity: item.quantity || 1,
              price: item.price || 0,
            };
          }
        })
      );

      return {
        id: order.order_number || order.id,
        customer: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone || '',
        date: new Date(order.created_at).toLocaleDateString(),
        amount: `£${order.total_amount.toFixed(2)}`,
        status: (order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()) as any,
        payment: (order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1).toLowerCase()) as any,
        items: itemsWithDetails.length,
        itemsDetail: itemsWithDetails,
        shippingAddress: order.shipping_address,
        total_amount: order.total_amount,
      };
    }));

    return NextResponse.json(transformedOrders);
  } catch (error) {
    console.error('Error in admin orders API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}