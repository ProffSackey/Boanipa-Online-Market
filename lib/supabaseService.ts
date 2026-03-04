import { supabase, supabaseAdmin } from './supabaseClient';

/**
 * Promotion Interface
 */
export interface Promotion {
  id?: string;
  name: string;
  type: "Percentage" | "Fixed";
  discount: string;
  deadline: string;
  description?: string;
  code: string;
  product_ids: string[];
  is_active: boolean;
  start_date: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Product Interface
 */
export interface Product {
  id?: string;
  name: string;
  description?: string;
  price: string;
  category: string;
  image_url?: string;
  images?: string[];
  status: string;
  rating?: number;
  about?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Category Interface
 */
export interface Category {
  id?: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Review Interface
 */
export interface Review {
  id?: string;
  product_id: string;
  rating: number;
  comment?: string;
  created_at?: string;
  // future: customer_id, status, etc.
}

/**
 * Notification Interface
 */
export interface Notification {
  id?: string;
  type: string;                // e.g. 'order_status', 'promotion', 'system', 'alert'
  title: string;
  message: string;
  recipient_type: string;      // 'admin' | 'customer' | 'all'
  recipient_email?: string;    // null for all
  is_read?: boolean;
  action_url?: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}


/**
 * Fetch all promotions
 */
export const fetchPromotions = async (): Promise<Promotion[]> => {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching promotions:', error);
      return [];
    }

    return (data || []).map((p) => ({
      ...p,
      product_ids: p.product_ids || [],
    }));
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return [];
  }
};

/**
 * Fetch a single promotion by ID
 */
export const fetchPromotion = async (id: string): Promise<Promotion | null> => {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching promotion:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching promotion:', error);
    return null;
  }
};

/**
 * Create a new promotion
 */
export const createPromotion = async (promotion: Promotion): Promise<Promotion | null> => {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .insert([promotion])
      .select()
      .single();

    if (error) {
      console.error('Error creating promotion:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error creating promotion:', error);
    return null;
  }
};

/**
 * Update a promotion
 */
export const updatePromotion = async (id: string, updates: Partial<Promotion>): Promise<Promotion | null> => {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating promotion:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error updating promotion:', error);
    return null;
  }
};

/**
 * Delete a promotion
 */
export const deletePromotion = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting promotion:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return false;
  }
};

// ============= REVIEWS =============

/**
 * Fetch reviews for a given product (or all if no id provided)
 */
export const fetchReviews = async (productId?: string): Promise<Review[]> => {
  try {
    let query = supabase.from('reviews').select('*');
    if (productId) {
      query = query.eq('product_id', productId);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

/**
 * Submit a new review and update product rating average
 */
export const submitReview = async (
  review: Review
): Promise<Review | null> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([review])
      .select()
      .single();
    if (error) {
      console.error('Error creating review:', error);
      return null;
    }
    return data || null;
  } catch (error) {
    console.error('Error creating review:', error);
    return null;
  }
};

// ============= NOTIFICATIONS =============

/**
 * Fetch notifications. Optionally filter by recipient_type or email.
 */
export const fetchNotifications = async (
  recipientType?: string,
  recipientEmail?: string
): Promise<Notification[]> => {
  try {
    const res = await fetch('/api/admin/notifications');
    if (!res.ok) {
      console.error('Error fetching notifications:', await res.text());
      return [];
    }
    const data = await res.json();
    return (data || []).map((n: any) => ({ ...n, is_read: n.is_read ?? false }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Mark single notification as read
 */
export const markNotificationRead = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      console.error('Error marking notification read:', await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error marking notification read:', error);
    return false;
  }
};

/**
 * Mark all notifications read (optionally filtered)
 */
export const markAllNotificationsRead = async (
  recipientType?: string,
  recipientEmail?: string
): Promise<boolean> => {
  try {
    const res = await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    if (!res.ok) {
      console.error('Error marking all notifications read:', await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    return false;
  }
};

/**
 * Create a new notification record
 */
export const createNotification = async (
  notification: Notification
): Promise<Notification | null> => {
  try {
    const res = await fetch('/api/admin/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    });
    if (!res.ok) {
      console.error('Error creating notification:', await res.text());
      return null;
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// ============= PRODUCTS =============

/**
 * Fetch all products
 */
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

/**
 * Fetch products by category
 */
export const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

/**
 * Fetch a single product
 */
export const fetchProduct = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

/**
 * Create a new product
 */
export const createProduct = async (product: Product): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
};

/**
 * Update a product
 */
export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error updating product:', error);
    return null;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
};

// ============= CATEGORIES =============

/**
 * Fetch all categories
 */
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Create a new category
 */
export const createCategory = async (category: Category): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error creating category:', error);
    return null;
  }
};

/**
 * Update a category
 */
export const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error updating category:', error);
    return null;
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
};

/**
 * Shipping Zone Interface
 */
export interface ShippingZone {
  id?: string;
  name: string;
  country: string;
  region?: string;
  base_fee: number;
  per_km_fee: number;
  min_delivery_days: number;
  max_delivery_days: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Calculate shipping fee based on country and region (postcode/state)
 */
export const calculateShippingFee = async (country: string, region?: string): Promise<{ fee: number; minDays: number; maxDays: number } | null> => {
  try {
    let query = supabase
      .from('shipping_zones')
      .select('base_fee, per_km_fee, min_delivery_days, max_delivery_days')
      .eq('country', country)
      .eq('is_active', true);

    // If region provided, try exact match first, then country-wide
    if (region) {
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        // Find matching region
        const zoneData = data.find((z: any) => z.region && z.region.includes(region.toUpperCase()));
        if (zoneData) {
          return {
            fee: parseFloat(zoneData.base_fee),
            minDays: zoneData.min_delivery_days,
            maxDays: zoneData.max_delivery_days,
          };
        }
      }
    }

    // Fall back to country-wide (region = NULL)
    const { data, error } = await supabase
      .from('shipping_zones')
      .select('base_fee, per_km_fee, min_delivery_days, max_delivery_days')
      .eq('country', country)
      .is('region', null)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error || !data) {
      console.error('Shipping zone not found for', country);
      return null;
    }

    return {
      fee: parseFloat(data.base_fee),
      minDays: data.min_delivery_days,
      maxDays: data.max_delivery_days,
    };
  } catch (error) {
    console.error('Error calculating shipping fee:', error);
    return null;
  }
};

/**
 * Get all active shipping zones
 */
export const getShippingZones = async (): Promise<ShippingZone[]> => {
  try {
    const { data, error } = await supabase
      .from('shipping_zones')
      .select('*')
      .eq('is_active', true)
      .order('country', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching shipping zones:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching shipping zones:', error);
    return [];
  }
};

/**
 * Create a new shipping zone
 */
export const createShippingZone = async (zone: ShippingZone): Promise<ShippingZone | null> => {
  try {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('shipping_zones')
      .insert([zone])
      .select();

    if (error) {
      console.error('Error creating shipping zone:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error creating shipping zone:', error);
    return null;
  }
};

/**
 * Update a shipping zone
 */
export const updateShippingZone = async (id: string, updates: Partial<ShippingZone>): Promise<ShippingZone | null> => {
  try {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('shipping_zones')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating shipping zone:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error updating shipping zone:', error);
    return null;
  }
};

/**
 * Delete a shipping zone
 */
export const deleteShippingZone = async (id: string): Promise<boolean> => {
  try {
    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('shipping_zones')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shipping zone:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting shipping zone:', error);
    return false;
  }
};

/**
 * Customer Interface
 */
export interface Customer {
  id?: string;
  email: string;
  name: string;
  phone?: string;
  address?: { street?: string; city?: string; postcode?: string; country?: string };
  total_orders?: number;
  total_spent?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch all customers
 */
export const fetchCustomers = async (): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};

/**
 * Fetch a single customer by ID
 */
export const fetchCustomer = async (id: string): Promise<Customer | null> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
};

/**
 * Create a new customer
 */
export const createCustomer = async (customer: Customer): Promise<Customer | null> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select();

    if (error) {
      console.error('Error creating customer:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error creating customer:', error);
    return null;
  }
};

/**
 * Cart Items - Supabase-backed shopping cart
 */
export interface CartItem {
  id: string;
  customer_email: string;
  product_id: string;
  quantity: number;
  product?: Product;
  added_at: string;
}

/**
 * Get all cart items for a customer
 */
export const getCartItems = async (email: string): Promise<CartItem[]> => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:product_id (*)
      `)
      .eq('customer_email', email)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Error fetching cart items:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return [];
  }
};

/**
 * Add item to cart (or update quantity if exists)
 */
export const addToCart = async (
  email: string,
  productId: string,
  quantity: number = 1
): Promise<CartItem | null> => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .upsert(
        {
          customer_email: email,
          product_id: productId,
          quantity,
        },
        { onConflict: 'customer_email,product_id' }
      )
      .select();

    if (error) {
      console.error('Error adding to cart:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return null;
  }
};

/**
 * Update cart item quantity
 */
export const updateCartItemQuantity = async (
  email: string,
  productId: string,
  quantity: number
): Promise<CartItem | null> => {
  try {
    if (quantity <= 0) {
      // remove item instead of returning boolean
      await removeFromCart(email, productId);
      return null;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('customer_email', email)
      .eq('product_id', productId)
      .select();

    if (error) {
      console.error('Error updating cart item:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error updating cart item:', error);
    return null;
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (
  email: string,
  productId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('customer_email', email)
      .eq('product_id', productId);

    if (error) {
      console.error('Error removing from cart:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error removing from cart:', error);
    return false;
  }
};

/**
 * Clear entire cart for a customer
 */
export const clearCart = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('customer_email', email);

    if (error) {
      console.error('Error clearing cart:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
};

