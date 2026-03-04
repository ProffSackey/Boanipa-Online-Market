import { calculateShippingFee } from '@/lib/supabaseService';

/**
 * GET /api/shipping-rates?country=GB&region=SW
 * Returns shipping fee and delivery estimate for a given country and region
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const country = url.searchParams.get('country')?.toUpperCase();
    const region = url.searchParams.get('region')?.toUpperCase();

    if (!country) {
      return Response.json(
        { error: 'Country code is required' },
        { status: 400 }
      );
    }

    const result = await calculateShippingFee(country, region || undefined);

    if (!result) {
      return Response.json(
        { error: `Shipping not available for ${country}` },
        { status: 404 }
      );
    }

    return Response.json({
      country,
      region: region || null,
      shippingFee: result.fee,
      estimatedDeliveryMin: result.minDays,
      estimatedDeliveryMax: result.maxDays,
    });
  } catch (error) {
    console.error('Shipping rate error:', error);
    return Response.json(
      { error: 'Failed to calculate shipping fee' },
      { status: 500 }
    );
  }
}
