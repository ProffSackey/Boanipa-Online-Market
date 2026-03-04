# Shipping & Delivery Fee System

## Overview

The shipping system supports dynamic pricing based on customer location (country and region). It's designed to handle UK, Ghana, USA, and can be easily expanded to other countries/regions.

---

## Database Schema

### `shipping_zones` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(255) | Zone name (e.g., "UK - London & Southeast") |
| `country` | VARCHAR(2) | ISO country code (GB, US, GH) |
| `region` | VARCHAR(100) | Postcode prefix or state code (optional, NULL for country-wide) |
| `base_fee` | DECIMAL(10, 2) | Flat shipping fee in GBP/local currency |
| `per_km_fee` | DECIMAL(10, 4) | Optional per-km charge for distance-based calculation |
| `min_delivery_days` | INT | Minimum delivery estimate |
| `max_delivery_days` | INT | Maximum delivery estimate |
| `is_active` | BOOLEAN | Enable/disable zone |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

---

## Current Setup

### UK Zones (by postcode prefix)
- London & Southeast (SW, SE, E, W, NW*): £3.99
- Midlands (B, CV, DY, WS, WV): £4.99
- North (M, L, SK, ST, OL, BL, BB, FY, PR): £5.99
- Southern (SO, BH, DT, EX, PL, TR, TA, BA): £4.99
- Wales (CF, LL, SA, SY): £5.99
- Scotland (EH, G, KY, ML, PA, PH, ZE): £6.99
- Northern Ireland (BT): £6.99

### USA Zones (by state)
- East Coast (NY, NJ, PA, MA, CT, RI, VT, NH, ME): $8.99
- South (GA, FL, SC, NC, VA, WV, KY, TN, AR, LA, MS): $9.99
- Midwest (OH, IN, IL, MI, WI, MN, IA, MO): $10.99
- West Coast (CA, OR, WA): $11.99
- Mountain (CO, WY, MT, ID, UT, NM, AZ, NV): $12.99
- Alaska & Hawaii (AK, HI): $24.99

### Ghana Zones
- Accra & Tema: GHS 15.00 (2-3 days)
- Kumasi & Ashanti: GHS 20.00 (2-4 days)
- Northern Region: GHS 30.00 (3-5 days)
- Other Regions: GHS 25.00 (3-5 days)

---

## API Usage

### Calculate Shipping Fee

**Endpoint:** `GET /api/shipping-rates`

**Query Parameters:**
- `country` (required): ISO country code (GB, US, GH)
- `region` (optional): Postcode prefix (UK), state code (US), or region code

**Example Requests:**

```bash
# UK - London (postcode SW prefix)
GET /api/shipping-rates?country=GB&region=SW
# Response: { shippingFee: 3.99, estimatedDeliveryMin: 1, estimatedDeliveryMax: 2 }

# USA - California
GET /api/shipping-rates?country=US&region=CA
# Response: { shippingFee: 11.99, estimatedDeliveryMin: 3, estimatedDeliveryMax: 5 }

# Ghana - Country-wide
GET /api/shipping-rates?country=GH
# Response: { shippingFee: 20.00, estimatedDeliveryMin: 2, estimatedDeliveryMax: 4 }
```

---

## TypeScript Usage

### In Your Components

```typescript
import { calculateShippingFee } from '@/lib/supabaseService';

// Calculate fee for UK postcode
const shippingInfo = await calculateShippingFee('GB', 'SW');
if (shippingInfo) {
  console.log(`Fee: £${shippingInfo.fee}, Delivery: ${shippingInfo.minDays}-${shippingInfo.maxDays} days`);
}

// Calculate fee for USA state
const usShipping = await calculateShippingFee('US', 'CA');

// Calculate fee for Ghana (no region)
const ghShipping = await calculateShippingFee('GH');
```

### In API Routes

```typescript
import { calculateShippingFee } from '@/lib/supabaseService';

export async function POST(request: Request) {
  const { country, region } = await request.json();
  
  const shippingInfo = await calculateShippingFee(country, region);
  if (!shippingInfo) {
    return Response.json({ error: 'Shipping not available' }, { status: 404 });
  }
  
  return Response.json(shippingInfo);
}
```

---

## Managing Shipping Zones

### Get All Active Zones

```typescript
import { getShippingZones } from '@/lib/supabaseService';

const zones = await getShippingZones();
console.log(zones);
```

### Create New Zone

```typescript
import { createShippingZone, ShippingZone } from '@/lib/supabaseService';

const newZone: ShippingZone = {
  name: 'France - Paris',
  country: 'FR',
  region: '75', // Postcode prefix
  base_fee: 7.99,
  per_km_fee: 0.10,
  min_delivery_days: 2,
  max_delivery_days: 4,
  is_active: true,
};

const created = await createShippingZone(newZone);
```

### Update Zone

```typescript
import { updateShippingZone } from '@/lib/supabaseService';

await updateShippingZone(zoneId, {
  base_fee: 8.99,
  is_active: true,
});
```

---

## Expanding to More Countries

To add new countries:

1. **Insert into `shipping_zones` table:**
   ```sql
   INSERT INTO shipping_zones (name, country, region, base_fee, per_km_fee, min_delivery_days, max_delivery_days, is_active)
   VALUES
     ('France - Île-de-France', 'FR', '75,77,78,91,92,93,94,95', 7.99, 0, 2, 3, true),
     ('France - Rest', 'FR', NULL, 9.99, 0, 3, 5, true),
     ('Canada - Ontario', 'CA', 'ON', 14.99, 0, 3, 5, true);
   ```

2. **Test with the API:**
   ```bash
   GET /api/shipping-rates?country=FR&region=75
   ```

---

## Best Practices

1. **Update zones via Admin Panel** (once UI is built) instead of direct SQL
2. **Test calculations** after adding new zones
3. **Use postcode prefixes** for UK (first 1-2 characters) for easier management
4. **Set realistic delivery times** based on actual carrier schedules
5. **Keep rates synchronized** across your website and order system
6. **Document regional codes** (postcodes, states) for reference

---

## Frontend Integration

When a customer enters their address:

```typescript
// Extract country and region from address
const country = address.country_code; // 'GB'
const region = address.postcode?.substring(0, 2) || undefined; // 'SW'

// Fetch shipping fee
const response = await fetch(`/api/shipping-rates?country=${country}&region=${region}`);
const { shippingFee, estimatedDeliveryMin, estimatedDeliveryMax } = await response.json();

// Display to customer
console.log(`Shipping: £${shippingFee.toFixed(2)}`);
console.log(`Delivery: ${estimatedDeliveryMin}-${estimatedDeliveryMax} days`);
```

---

## Next Steps

1. Run the migration SQL in Supabase
2. Test API endpoint
3. Update checkout page to calculate shipping dynamically
4. Add admin UI to manage zones in Settings page
