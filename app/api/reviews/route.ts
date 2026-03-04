import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get("product_id");

    const supabase = getSupabaseAdmin(); // read access ok with anon but admin simplifies later updates
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    let query = supabase.from("reviews").select("*");
    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching reviews:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (e) {
    console.error("Unexpected error in GET /api/reviews", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, rating, comment, customer_id } = body;

    if (!product_id || rating == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // insert new review data object
    const reviewData: any = { product_id, rating, comment };
    if (customer_id) reviewData.customer_id = customer_id;

    const { data: newReview, error: insertErr } = await supabase
      .from("reviews")
      .insert([reviewData])
      .select()
      .single();

    if (insertErr) {
      console.error("Error inserting review:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // recompute average rating for the product
    const { data: allRatings, error: fetchErr } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", product_id);

    if (!fetchErr && allRatings && allRatings.length > 0) {
      const sum = allRatings.reduce((acc: any, r: any) => acc + r.rating, 0);
      const avg = sum / allRatings.length;
      // store average on products table
      await supabase.from("products").update({ rating: avg }).eq("id", product_id);
    }

    return NextResponse.json(newReview);
  } catch (e) {
    console.error("Unexpected error in POST /api/reviews", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
