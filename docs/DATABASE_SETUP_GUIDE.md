# Supabase Database Schema Documentation
**Boania Online Market** | Created: March 2, 2026

## 📋 Table of Contents
1. [Quick Setup](#quick-setup)
2. [Table Schemas](#table-schemas)
3. [Field Mappings](#field-mappings)
4. [Relationships](#relationships)
5. [Usage Examples](#usage-examples)
6. [Security & RLS](#security--rls)

---

## 🚀 Quick Setup

### Step 1: Create Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details and create
4. Wait for database to initialize

### Step 2: Execute SQL Schema
1. Open **SQL Editor** in Supabase dashboard
2. Create new query
3. Copy entire contents of `SUPABASE_SCHEMA.sql`
4. Paste into editor
5. Click "Run" button
6. Verify all tables created successfully

### Step 3: Get Credentials
```
Settings > API > Keys
- Copy ANON_KEY → Store in .env.local as NEXT_PUBLIC_SUPABASE_ANON_KEY
- Copy SERVICE_ROLE_KEY → Store securely as SUPABASE_SERVICE_ROLE_KEY
- Copy PROJECT_URL → Store in .env.local as NEXT_PUBLIC_SUPABASE_URL
```

### Step 4: Update Environment Variables
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Backend only
```

---

## 📊 Table Schemas

### 1. **CATEGORIES**
Product category listings with descriptions.

```typescript
interface Category {
  id: string;                    // UUID - Primary Key
  name: string;                  // Unique category name
  description?: string;          // Optional description
  created_at: string;           // ISO timestamp
  updated_at: string;           // ISO timestamp
}
```

**Indexes:** `name`

---

### 2. **PRODUCTS**
Product inventory with pricing and metadata.

```typescript
interface Product {
  id: string;                    // UUID - Primary Key
  name: string;                  // Product name
  description?: string;          // Long description
  price: string;                 // "£159.99" format
  category: string;              // FK to categories.name
  image_url?: string;            // Single main image URL
  images?: string[];             // Array of image URLs
  status: string;                // 'active' | 'inactive' | 'archived'
  rating?: number;               // 0-5 stars
  about?: string;                // Short description
  stock_quantity?: number;       // Inventory count
  sku?: string;                  // Stock keeping unit
  created_at: string;           // ISO timestamp
  updated_at: string;           // ISO timestamp
}
```

**Indexes:** `category`, `status`, `created_at`, `name`  
**Constraints:** `price NOT NULL`, `name NOT NULL`

---

### 3. **PROMOTIONS**
Discount campaigns and promotional codes.

```typescript
interface Promotion {
  id: string;                    // UUID - Primary Key
  name: string;                  // "Spring Sale - 20% Off"
  type: string;                  // 'Percentage' | 'Fixed'
  discount: string;              // "20%" | "£10"
  deadline: string;              // ISO timestamp
  description?: string;          // Campaign description
  code: string;                  // Unique promo code "SPRING20"
  product_ids: string[];         // Array of product UUIDs
  is_active: boolean;            // Currently running?
  start_date: string;            // ISO date "2026-03-01"
  created_at: string;           // ISO timestamp
  updated_at: string;           // ISO timestamp
}
```

**Indexes:** `is_active`, `code`, `deadline`, `created_at`  
**Constraints:** `code UNIQUE`, `type NOT NULL`

---

### 4. **ORDERS**
Customer orders with items and status tracking.

```typescript
interface Order {
  id: string;                    // UUID - Primary Key
  order_number: string;          // "#ORD-001234" unique
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_amount: number;          // Decimal(10,2)
  status: string;                // 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: string;        // 'unpaid' | 'paid' | 'refunded'
  items: {                        // JSONB array
    productId: string;
    quantity: number;
    price: string;
    promotion_code?: string;
  }[];
  shipping_address: {            // JSONB object
    street: string;
    city: string;
    postcode: string;
    country: string;
  };
  promo_code?: string;
  discount_amount?: number;
  created_at: string;
  updated_at: string;
}
```

**Indexes:** `customer_email`, `status`, `payment_status`, `created_at`, `order_number`

---

### 5. **TRANSACTIONS**
Payment transaction records linked to orders.

```typescript
interface Transaction {
  id: string;                    // UUID - Primary Key
  order_id: string;              // FK to orders.id
  transaction_id: string;        // Payment gateway reference
  amount: number;                // Decimal(10,2)
  currency: string;              // 'GBP', 'USD', etc.
  payment_method: string;        // 'card' | 'paypal' | 'stripe'
  status: string;                // 'pending' | 'completed' | 'failed' | 'refunded'
  description?: string;
  metadata: any;                 // JSONB - Payment gateway data
  created_at: string;
  updated_at: string;
}
```

**Indexes:** `order_id`, `status`, `created_at`  
**Constraints:** `transaction_id UNIQUE`

---

### 6. **ADMIN_USERS**
Admin account management with authentication.

```typescript
interface AdminUser {
  id: string;                    // UUID - Primary Key
  email: string;                 // Unique
  username: string;              // Unique
  password_hash: string;         // Bcrypt hashed
  role: string;                  // 'admin' | 'moderator' | 'viewer'
  is_active: boolean;
  last_login?: string;           // ISO timestamp
  created_at: string;
  updated_at: string;
}
```

**Indexes:** `email`, `username`  
**Security:** Use Supabase Auth for actual authentication

---

### 7. **CUSTOMERS**
Customer profiles with contact and purchase history.

```typescript
interface Customer {
  id: string;                    // UUID - Primary Key
  email: string;                 // Unique
  name: string;
  phone?: string;
  address: {                     // JSONB
    street?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  total_orders: number;          // Lifetime orders
  total_spent: number;           // Lifetime spending
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

**Indexes:** `email`, `created_at`

---

### 8. **REVIEWS**
Product reviews and ratings from verified customers.

```typescript
interface Review {
  id: string;                    // UUID - Primary Key
  product_id: string;            // FK to products.id
  customer_id: string;           // FK to customers.id
  rating: number;                // 1-5 (check constraint)
  title?: string;
  comment?: string;
  helpful_count: number;         // "Helpful" votes
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}
```

**Indexes:** `product_id`, `customer_id`, `rating`, `created_at`

---

### 9. **NOTIFICATIONS**
System alerts and messages that can be targeted at admins or individual customers.

```typescript
interface Notification {
  id: string;                    // UUID - Primary Key
  type: string;                  // 'order_status' | 'promotion' | 'system' | 'alert'
  title: string;
  message: string;
  recipient_type: string;        // 'admin' | 'customer' | 'all'
  recipient_email?: string;      // NULL if for all
  is_read: boolean;
  action_url?: string;           // Link to take action
  metadata?: any;                // JSONB
  created_at: string;
  updated_at: string;
}
```

**Indexes:** `recipient_email`, `is_read`, `created_at`, `type`


#### RLS policies (see schema)
- **Admins** can read any notification where `recipient_type` is `admin` or `all`.
- **Customers** may read notifications addressed to them (`recipient_type = 'customer'` and their email) or to `all`.
- **Inserts** are restricted to service-role or admin JWTs; clients cannot write directly.
- **Updates**: admins can modify anything; customers may only mark their own messages as read.

#### Creating notifications
Notifications are typically generated in backend code when events occur. example:

```ts
import { createNotification } from '../lib/supabaseService';

// when new order arrives (server-side handler)
// *also triggers email if SMTP is configured*
await createNotification({
  type: 'order_status',
  title: 'New order received',
  message: `Order #${order.order_number} from ${order.customer_name}`,
  recipient_type: 'admin',
  is_read: false,
});

// you could call this from an order‑creation API or webhook
// for example, in a POST /api/orders handler:
//
// const order = await supabase.from('orders').insert([...]).single();
// await createNotification({
//   type: 'order_status',
//   title: 'Order placed',
//   message: `Order ${order.order_number} for ${order.customer_name}`,
//   recipient_type: 'admin',
//   is_read: false,
// });

// low-stock alert to admin
await createNotification({
  type: 'alert',
  title: 'Low stock',
  message: `${product.name} has only ${product.stock_quantity} left`,
  recipient_type: 'admin',
  is_read: false,
});

// send customer one
await createNotification({
  type: 'system',
  title: 'Your order shipped',
  message: `Order ${order.order_number} is on the way!`,
  recipient_type: 'customer',
  recipient_email: order.customer_email,
  is_read: false,
  action_url: `/orders/${order.id}`,
});
```

---

### 10. **MESSAGES**
Customer support messages with threading support.

```typescript
interface Message {
  id: string;                    // UUID - Primary Key
  sender_email: string;
  recipient_email: string;
  subject?: string;
  body: string;
  is_read: boolean;
  parent_message_id?: string;    // FK to messages.id (for threading)
  created_at: string;
  updated_at: string;
}
```

**Indexes:** `sender_email`, `recipient_email`, `is_read`, `created_at`

---

### 11. **ANALYTICS**
Daily aggregated metrics and KPIs.

```typescript
interface Analytics {
  id: string;                    // UUID - Primary Key
  date: string;                  // ISO date - UNIQUE
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  average_order_value: number;
  top_products: {                // JSONB array
    productId: string;
    name: string;
    sales: number;
  }[];
  top_categories: {              // JSONB array
    category: string;
    sales: number;
  }[];
  created_at: string;
  updated_at: string;
}
```

**Indexes:** `date`  
**Notes:** Run aggregation job daily at midnight

---

### 12. **SETTINGS**
Application configuration and feature flags.

```typescript
interface Setting {
  id: string;                    // UUID - Primary Key
  key: string;                   // "maintenance_mode" (UNIQUE)
  value: string;                 // "true"
  description?: string;
  type: string;                  // 'string' | 'number' | 'boolean' | 'json'
  created_at: string;
  updated_at: string;
}
```

**Indexes:** `key`

---

## 🔗 Field Mappings (Database to TypeScript)

### Snake_case (Database) → camelCase (TypeScript)

The app uses a consistent pattern: Supabase returns snake_case, we convert to camelCase in TypeScript interfaces.

```typescript
// Database columns → TypeScript properties
product_ids        → productIds or product_ids (handled by util)
is_active          → isActive or is_active
start_date         → startDate or start_date
created_at         → createdAt or created_at (usually kept as-is)
updated_at         → updatedAt or updated_at (usually kept as-is)
```

---

## 📐 Relationships

### Foreign Key Relationships

```
products.category → categories.name (many-to-one)
orders.items[].productId → products.id (many-to-many via JSONB)
transactions.order_id → orders.id (many-to-one)
reviews.product_id → products.id (many-to-one)
reviews.customer_id → customers.id (many-to-one)
messages.parent_message_id → messages.id (self-referential)
```

### Entity Relationship Diagram (ERD)

```
CATEGORIES
    ↑
    │ (has many)
PRODUCTS ←(many) PROMOTIONS (via product_ids array)
    ↑
    │ (has many)
REVIEWS ←(has) CUSTOMERS
    ↑
    │
ORDERS (has many)
    ↓
TRANSACTIONS
    ↓
ADMIN_USERS (creates/manages)
```

---

## 💻 Usage Examples

### Fetch Active Promotions
```typescript
import { fetchPromotions } from '../lib/supabaseService';

const promotions = await fetchPromotions();
// Returns array of active promotions
```

### Get Products by Category
```typescript
import { fetchProductsByCategory } from '../lib/supabaseService';

const products = await fetchProductsByCategory('Appliances');
```

### Create Order
```typescript
const { data, error } = await supabase
  .from('orders')
  .insert([{
    order_number: '#ORD-001',
    customer_email: 'user@example.com',
    total_amount: 199.99,
    status: 'pending',
    payment_status: 'unpaid',
    items: [{ productId: '...', quantity: 2, price: '£99.99' }]
  }])
  .select()
  .single();
```

### Query Orders by Customer
```typescript
const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .eq('customer_email', 'customer@example.com')
  .order('created_at', { ascending: false });
```

### Insert Product Review
```typescript
const { data: review } = await supabase
  .from('reviews')
  .insert([{
    product_id: productId,
    customer_id: customerId,
    rating: 5,
    title: 'Excellent product!',
    comment: 'Highly recommended',
    is_verified_purchase: true
  }])
  .select()
  .single();
```

---

## 🔐 Security & RLS

### Row Level Security (RLS) Policies

**Public Read Policies (Already Enabled)**
- Categories: All users can view
- Products: Only active products visible
- Promotions: Only active promotions visible
- Reviews: All users can view

**Admin Policies (Recommended to Add)**
```sql
-- Admin can create/update/delete promotions
CREATE POLICY "Admins manage promotions" ON promotions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Admin can view all orders  
CREATE POLICY "Admins view all orders" ON orders
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Customers can view their own orders
CREATE POLICY "Customers view own orders" ON orders
  FOR SELECT USING (auth.uid() = customer_id);
```

### Best Practices
✅ Always use anon key in frontend  
✅ Always use service role key in backend API routes only  
✅ Enable RLS on sensitive tables  
✅ Implement proper JWT validation  
✅ Never expose service role key to client  
✅ Use `supabaseAdmin` from `supabaseClient.ts` for privileged operations  

### Storage Bucket & Policies
Images and files are stored in **Supabase Storage** (not the database).

1. **Create the bucket** in the dashboard (Settings → Storage → Create Bucket)
   - **Name:** `products`
   - **Public:** ✅ (so URLs can be accessed directly)

2. **Run the following SQL** (also included in `SUPABASE_SCHEMA.sql`):
```sql
-- public read (everyone can view product images)
CREATE POLICY "Products bucket public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

-- authenticated users may upload
CREATE POLICY "Products bucket authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

-- authenticated users may delete (optional)
CREATE POLICY "Products bucket admin delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'products' AND auth.role() = 'authenticated');
```

3. **Use the helper module** `lib/storageService.ts` for uploads/deletes; it wraps the `supabase.storage` API and returns public URLs.

---

---



## 📧 Email Notifications

Admins can optionally receive an email whenever a new notification is created.
The backend uses `nodemailer` and requires SMTP credentials defined in
`.env.local`:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=you@yourdomain.com
SMTP_PASS=supersecret
ADMIN_EMAILS=admin1@domain.com,admin2@domain.com
```

The `ADMIN_EMAILS` variable is a comma‑separated list; only these addresses will
be mailed. The service automatically fires whenever an admin‑targeted
notification is inserted via the `/api/admin/notifications` route or the
`createNotification` helper.

Existing email/SMS systems can also call the POST route directly (just ensure
an admin cookie is set or you use a service role token).

---

## 📈 Performance Optimization

### Query Optimization
- All foreign keys have indexes
- Common filter columns indexed (status, category, created_at)
- JSONB queries use GIN indexes (automatic in Supabase)

### Recommendations
1. **Pagination**: Use limit/offset for large result sets
2. **Aggregations**: Use analytics table instead of real-time calculations
3. **Caching**: Cache category list (rarely changes)
4. **Batch Operations**: Group multiple inserts
5. **Archive**: Move old orders to archive table

### Example - Optimized Query
```typescript
// ✅ Good - with limit and indexes
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('status', 'delivered')
  .order('created_at', { ascending: false })
  .limit(50)
  .range(0, 49);

// ❌ Avoid - fetching all records
const { data } = await supabase
  .from('orders')
  .select('*');
```

---

## 🔄 Backup & Restore

**Automatic Backups** (Supabase handles)
- Daily backups retained for 7 days
- Point-in-time recovery available

**Manual Backup**
```bash
# Export to SQL file
pg_dump "postgresql://user:password@host:5432/db" > backup.sql

# Restore from backup
psql "postgresql://user:password@nehost:5432/db" < backup.sql
```

---

## ❓ FAQ

**Q: Can I use this schema with PostgreSQL directly?**  
A: Yes! The schema is standard PostgreSQL. Works with any PG-compatible database.

**Q: How do I handle multi-tenancy?**  
A: Add `tenant_id` UUID column to all tables and include in RLS policies.

**Q: What's the maximum table size?**  
A: Supabase hosted can handle unlimited rows. Add partitioning for >100M rows.

**Q: How do I seed initial data?**  
A: Insert categories at end of schema (see SAMPLE DATA section).

---

## 📞 Support

For issues:
1. Check Supabase logs in dashboard
2. Enable query statistics in Supabase settings
3. Review RLS policies if data is hidden
4. Verify environment variables are set correctly
