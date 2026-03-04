-- =============================================================================
-- BOANIA ONLINE MARKET - SUPABASE DATABASE SCHEMA
-- Created: March 2, 2026
-- =============================================================================

-- =============================================================================
-- 1. CATEGORIES TABLE
-- =============================================================================
DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_categories_name ON categories(name);

-- =============================================================================
-- 2. PRODUCTS TABLE
-- =============================================================================
DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price VARCHAR(50) NOT NULL, -- Stored as string (e.g., "£159.99")
  category VARCHAR(255) NOT NULL REFERENCES categories(name) ON DELETE SET NULL,
  image_url TEXT, -- Single primary image
  images TEXT[], -- Array of image URLs
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, inactive, archived
  rating DECIMAL(3, 2) DEFAULT 0, -- 0.0 to 5.0
  about TEXT, -- Short description/about
  stock_quantity INT DEFAULT 0,
  sku VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_name ON products(name);

-- =============================================================================
-- 3. PROMOTIONS TABLE
-- =============================================================================
DROP TABLE IF EXISTS promotions CASCADE;

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'Percentage' or 'Fixed'
  discount VARCHAR(50) NOT NULL, -- e.g., "20%" or "£10"
  deadline TIMESTAMP NOT NULL,
  description TEXT,
  code VARCHAR(100) NOT NULL UNIQUE, -- Promo code
  product_ids UUID[] NOT NULL DEFAULT '{}', -- Array of product UUIDs
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_promotions_is_active ON promotions(is_active);
CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_deadline ON promotions(deadline);
CREATE INDEX idx_promotions_created_at ON promotions(created_at DESC);

-- =============================================================================
-- 4. ORDERS TABLE
-- =============================================================================
DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid', -- unpaid, paid, refunded
  items JSONB NOT NULL, -- Array of {productId, quantity, price, promotion_code}
  shipping_address JSONB,
  promo_code VARCHAR(100),
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- =============================================================================
-- 5. TRANSACTIONS TABLE
-- =============================================================================
DROP TABLE IF EXISTS transactions CASCADE;

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GBP',
  payment_method VARCHAR(50) NOT NULL, -- card, paypal, stripe, etc.
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  description TEXT,
  metadata JSONB, -- Additional payment gateway data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_transactions_order_id ON transactions(order_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- =============================================================================
-- 6. ADMIN_USERS TABLE
-- =============================================================================
DROP TABLE IF EXISTS admin_users CASCADE;

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin', -- admin, moderator, viewer
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_username ON admin_users(username);

-- =============================================================================
-- 7. CUSTOMERS TABLE
-- =============================================================================
DROP TABLE IF EXISTS customers CASCADE;

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address JSONB, -- {street, city, postcode, country}
  total_orders INT DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

-- =============================================================================
-- 8. REVIEWS TABLE
-- =============================================================================
DROP TABLE IF EXISTS reviews CASCADE;

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  helpful_count INT DEFAULT 0,
  is_verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- =============================================================================
-- 9. NOTIFICATIONS TABLE
-- =============================================================================
DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- order_status, promotion, system, alert
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  recipient_type VARCHAR(50) NOT NULL, -- admin, customer, all
  recipient_email VARCHAR(255), -- NULL if for all
  is_read BOOLEAN DEFAULT false,
  action_url VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_notifications_recipient_email ON notifications(recipient_email);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- =============================================================================
-- 10. MESSAGES TABLE
-- =============================================================================
DROP TABLE IF EXISTS messages CASCADE;

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_email VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- For threading
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_messages_sender_email ON messages(sender_email);
CREATE INDEX idx_messages_recipient_email ON messages(recipient_email);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- =============================================================================
-- 11. ANALYTICS TABLE
-- =============================================================================
DROP TABLE IF EXISTS analytics CASCADE;

CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  total_customers INT DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,
  top_products JSONB, -- {productId, name, sales}[]
  top_categories JSONB, -- {category, sales}[]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_analytics_date ON analytics(date DESC);

-- =============================================================================
-- 12. SETTINGS TABLE
-- =============================================================================
DROP TABLE IF EXISTS settings CASCADE;

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  type VARCHAR(50), -- string, number, boolean, json
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_settings_key ON settings(key);

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) - Optional but Recommended
-- =============================================================================

-- Enable RLS on tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to allow recreation
DROP POLICY IF EXISTS "Categories are visible to all" ON categories;
DROP POLICY IF EXISTS "Active products are visible to all" ON products;
DROP POLICY IF EXISTS "Active promotions are visible to all" ON promotions;
DROP POLICY IF EXISTS "Reviews are visible to all" ON reviews;
DROP POLICY IF EXISTS "Admins can see notifications" ON notifications;
DROP POLICY IF EXISTS "Customers can see own notifications" ON notifications;
DROP POLICY IF EXISTS "Insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admins update notifications" ON notifications;
DROP POLICY IF EXISTS "Customer update own notification" ON notifications;

-- Create public read policy for categories (everyone can view)
CREATE POLICY "Categories are visible to all" ON categories
  FOR SELECT USING (true);

-- Create public read policy for products (everyone can view active products)
CREATE POLICY "Active products are visible to all" ON products
  FOR SELECT USING (status = 'active');

-- Create public read policy for promotions (everyone can view active promotions)
CREATE POLICY "Active promotions are visible to all" ON promotions
  FOR SELECT USING (is_active = true);

-- Create public read policy for reviews (everyone can view published reviews)
CREATE POLICY "Reviews are visible to all" ON reviews
  FOR SELECT USING (true);

-- =======================
-- NOTIFICATIONS POLICIES
-- =======================

-- Admin users may select any admin/all notifications
CREATE POLICY "Admins can see notifications" ON notifications
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' AND
    (recipient_type = 'admin' OR recipient_type = 'all')
  );

-- Customers may select notifications sent to them or to all
CREATE POLICY "Customers can see own notifications" ON notifications
  FOR SELECT USING (
    recipient_type = 'all' OR
    (
      recipient_type = 'customer' AND
      auth.jwt() ->> 'email' = recipient_email
    )
  );

-- Inserts must come from service role or admin
CREATE POLICY "Insert notifications" ON notifications
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.role() = 'service_role'
  );

-- Admins can update any notification (e.g. mark read or modify)
CREATE POLICY "Admins update notifications" ON notifications
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Customers can only update their own read status
CREATE POLICY "Customer update own notification" ON notifications
  FOR UPDATE USING (
    recipient_type = 'customer' AND
    auth.jwt() ->> 'email' = recipient_email
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'customer'
  );

-- =============================================================================
-- STORAGE BUCKET & POLICIES (for product images)
-- =============================================================================

-- Create products storage bucket (run in Supabase Dashboard if needed)
-- Settings > Storage > Create Bucket > Name: "products" > Public

-- Drop existing storage policies to allow recreation
DROP POLICY IF EXISTS "Products bucket public read" ON storage.objects;
DROP POLICY IF EXISTS "Products bucket authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Products bucket admin delete" ON storage.objects;

-- Public read policy for product images (everyone can view)
CREATE POLICY "Products bucket public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

-- Authenticated upload policy (users can upload to products bucket)
CREATE POLICY "Products bucket authenticated upload" ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

-- Admin delete policy (only authenticated users can delete)
CREATE POLICY "Products bucket admin delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'products' AND auth.role() = 'authenticated');

-- =============================================================================
-- SAMPLE DATA (Optional - Remove in production)
-- =============================================================================

-- Insert sample categories
INSERT INTO categories (name, description) 
VALUES
  ('Appliances', 'Kitchen and home appliances'),
  ('Grocessories', 'Groceries and food items'),
  ('Health & Beauty', 'Health, beauty, and personal care products')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- NOTES & SETUP INSTRUCTIONS
-- =============================================================================
/*
1. Copy and paste this entire script into Supabase SQL Editor
2. Execute to create all tables and indexes
3. Update environment variables with your Supabase URL and keys
4. Enable authentication in Supabase dashboard if needed
5. Set up RLS policies for security
6. Configure backup settings in Supabase dashboard

FIELD NAME CONVENTIONS:
- Use snake_case for database columns
- Convert to camelCase in TypeScript interface definitions
- Example: product_ids (DB) -> product_ids (app, handled by supabaseService)

DATA TYPES:
- UUID: Auto-generated unique identifiers
- DECIMAL(10, 2): Money values (10 digits, 2 decimals)
- TIMESTAMP WITH TIME ZONE: Always use timezone-aware timestamps
- JSONB: For flexible JSON data (better performance than JSON)
- TEXT[]: Array of strings (e.g., product_ids)

PERFORMANCE TIPS:
- All frequently-queried foreign keys have indexes
- Use DECIMAL for money, not FLOAT
- JSONB is more efficient than JSON for queries
- Partitioning by date recommended for analytics table if >1M rows
- Consider materializing views for complex aggregations

SECURITY:
- Enable RLS policies at table level
- Authenticate users via Supabase Auth
- Use service role key ONLY on backend (API routes)
- Use anon key in frontend (limited by RLS policies)
- Never expose service role key to client
*/
