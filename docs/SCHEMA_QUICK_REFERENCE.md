# 📚 Supabase Schema - Quick Reference

## 12 Database Tables

| Table | Purpose | Key Fields | Row Count |
|-------|---------|-----------|-----------|
| **CATEGORIES** | Product types | id, name, description | ~10 |
| **PRODUCTS** | Inventory (with stock) | id, name, price, category, stock_quantity, status | ~1000+ |
| **PROMOTIONS** | Discount campaigns | id, code, discount, product_ids, is_active | ~50 |
| **ORDERS** | Customer purchases | id, order_number, customer_email, total_amount | ~10000+ |
| **TRANSACTIONS** | Payment records | id, order_id, amount, payment_method, status | ~10000+ |
| **ADMIN_USERS** | Staff accounts | id, email, username, role | ~5-20 |
| **CUSTOMERS** | Customer profiles | id, email, name, total_orders, total_spent | ~5000+ |
| **REVIEWS** | Product feedback | id, product_id, rating, comment | ~5000+ |
| **NOTIFICATIONS** | System alerts | id, type, recipient_email, is_read | ~50000+ |
| **MESSAGES** | Support tickets | id, sender_email, subject, body | ~10000+ |
| **ANALYTICS** | Daily metrics | id, date, total_revenue, top_products | ~1000 rows/year |
| **SETTINGS** | App config | id, key, value, type | ~20 |

---

## 🔑 Primary Key: All tables use UUID

```
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

---

## 📊 Data Types Used

```
UUID              → Unique identifiers
VARCHAR(n)        → Text (fixed max length)
TEXT              → Long text (unlimited)
DECIMAL(10, 2)    → Money (10 digits, 2 decimals)
INT               → Whole numbers
BOOLEAN           → true/false
DATE              → YYYY-MM-DD
TIMESTAMP WITH TZ → Full datetime with timezone
JSONB             → JSON objects/arrays (queryable)
TEXT[]            → Array of strings
```

---

## 🗂️ Table Dependencies

```
CATEGORIES
    ↓ (1-to-Many)
PRODUCTS
    ↓ (1-to-Many)
REVIEWS ←(Many-to-1)← CUSTOMERS

ORDERS
    ↓ (1-to-Many)
TRANSACTIONS

PROMOTIONS
    ↓ (Contains product_ids UUIDs)
PRODUCTS

ADMIN_USERS (Manages everything)
```

---

## 📝 Common Operations

### CREATE
```typescript
// Create product
await supabase.from('products').insert([product]).select().single();

// Create promotion
await supabase.from('promotions').insert([promo]).select().single();

// Create order
await supabase.from('orders').insert([order]).select().single();
```

### READ
```typescript
// Get all active promotions
await supabase.from('promotions').select('*').eq('is_active', true);

// Get products by category
await supabase.from('products').select('*').eq('category', 'Appliances');

// Get customer orders
await supabase.from('orders').select('*').eq('customer_email', email);
```

### UPDATE
```typescript
// Update promotion
await supabase.from('promotions').update(updates).eq('id', id).select().single();

// Update product stock
await supabase.from('products').update({ stock_quantity: 50 }).eq('id', id);

// Update order status
await supabase.from('orders').update({ status: 'shipped' }).eq('id', id);
```

### DELETE
```typescript
// Delete promotion (cascades to nothing, safe)
await supabase.from('promotions').delete().eq('id', id);

// Delete product (would delete attached reviews)
await supabase.from('products').delete().eq('id', id);
```

---

## 🔗 Foreign Keys & Constraints

| From | To | Type | Action |
|------|-----|------|--------|
| products.category | categories.name | Many-to-One | SET NULL |
| transactions.order_id | orders.id | Many-to-One | CASCADE |
| reviews.product_id | products.id | Many-to-One | CASCADE |
| reviews.customer_id | customers.id | Many-to-One | CASCADE |
| messages.parent_message_id | messages.id | Self-Ref | CASCADE |

---

## 🏃 Quick Setup Steps

1. **Create Supabase Project** → [supabase.com](https://supabase.com)
2. **Copy Schema** → `SUPABASE_SCHEMA.sql`
3. **Run SQL** → Supabase > SQL Editor > Paste & Run
4. **Set Env Vars** → Copy keys to `.env.local`
5. **Done!** → App ready to use

---

## 🔐 Security Checklist

- [ ] NEXT_PUBLIC_SUPABASE_URL set in .env.local
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY set in .env.local
- [ ] SUPABASE_SERVICE_ROLE_KEY set (backend only, NOT in .env.local)
- [ ] RLS enabled on sensitive tables
- [ ] Never expose service role key to client
- [ ] Use supabaseAdmin only in API routes
- [ ] Use supabase (anon) client in components

---

## 📊 Database File Structure

```
Your Project
├── lib/
│   ├── supabaseClient.ts          ← Initialize Supabase
│   └── supabaseService.ts         ← CRUD operations
├── docs/
│   ├── SUPABASE_SCHEMA.sql        ← Database schema (THIS FILE)
│   ├── DATABASE_SETUP_GUIDE.md    ← Detailed docs
│   └── SCHEMA_QUICK_REFERENCE.md  ← Quick reference
├── app/
│   ├── page.tsx                   ← Uses fetchProducts, fetchPromotions
│   ├── admin/
│   │   ├── promotions/page.tsx    ← Create/edit promotions
│   │   ├── products/page.tsx      ← Manage products
│   │   └── ...                    ← Other admin pages
│   └── ...
└── .env.local                     ← Supabase credentials
```

---

## 🚨 Common Issues & Fixes

### "No rows returned"
- Check RLS policies allow your query
- Verify data exists: `SELECT COUNT(*) FROM table;`
- Check WHERE conditions

### "Duplicate key violation"
- Email/code/username already exists
- Use CONFLICT clause: `.upsert()` in Supabase

### "Foreign key constraint violation"
- Parent record doesn't exist
- Delete child records first

### "Column not found"
- Check field name (case-sensitive!)
- Use snake_case in database, camelCase in TS

### Slow queries
- Add missing indexes (see schema file)
- Use LIMIT for large result sets
- Check query explain plan

---

## 📈 Scaling Checklist

As you grow, consider:

- [ ] Archive old orders (`orders_archive` table)
- [ ] Partition analytics table by date/month
- [ ] Add read replicas for read-heavy workloads
- [ ] Implement connection pooling
- [ ] Cache frequently-accessed data (categories)
- [ ] Batch insert operations
- [ ] Add database query logging/monitoring

---

## 🔄 Sync with App Code

The database schema syncs with TypeScript interfaces in:

```
lib/supabaseService.ts

interface Promotion {
  id?: string;
  name: string;
  type: "Percentage" | "Fixed";
  discount: string;
  deadline: string;
  description?: string;
  code: string;
  product_ids: string[];    ← Array of UUIDs
  is_active: boolean;
  start_date: string;
  created_at?: string;
  updated_at?: string;
}
```

Keep interfaces in sync with schema!

---

## 📞 Helpful Links

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **Supabase Dashboard**: https://app.supabase.com
- **Supabase Status**: https://status.supabase.com
- **Query Performance**: Settings > Database > Query Performance
- **Backups**: Settings > Backups > Manage Backups

---

## ✅ Verification Checklist

After setup, verify everything works:

```sql
-- Count all tables
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM promotions;
SELECT COUNT(*) FROM orders;
-- etc...

-- Check recent data
SELECT * FROM categories LIMIT 5;
SELECT * FROM promotions WHERE is_active = true;
SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;

-- View indexes
SELECT * FROM pg_stat_user_indexes;

-- Check table sizes
SELECT table_name, pg_size_pretty(pg_total_relation_size(table_schema||'.'||table_name)) AS size
FROM information_schema.tables
WHERE table_schema = 'public';
```

---

**Last Updated**: March 2, 2026  
**Schema Version**: 1.0  
**Database**: PostgreSQL 14+ (Supabase)
