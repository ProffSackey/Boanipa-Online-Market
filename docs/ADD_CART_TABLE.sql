-- =============================================================================
-- ADD CART_ITEMS TABLE TO SUPABASE
-- =============================================================================

DROP TABLE IF EXISTS cart_items CASCADE;

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email VARCHAR(255) NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_email, product_id)
);

-- Create indexes for common queries
CREATE INDEX idx_cart_items_customer_email ON cart_items(customer_email);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_cart_items_added_at ON cart_items(added_at DESC);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Customers can only see/modify their own cart
CREATE POLICY "Customers can see own cart" ON cart_items
  FOR SELECT USING (auth.jwt() ->> 'email' = customer_email);

CREATE POLICY "Customers can add to own cart" ON cart_items
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = customer_email);

CREATE POLICY "Customers can update own cart" ON cart_items
  FOR UPDATE USING (auth.jwt() ->> 'email' = customer_email);

CREATE POLICY "Customers can delete own cart items" ON cart_items
  FOR DELETE USING (auth.jwt() ->> 'email' = customer_email);
