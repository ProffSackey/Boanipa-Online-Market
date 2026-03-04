"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { addToCart } from '@/lib/supabaseService';

interface Product {
  id: number | string;
  name: string;
  description?: string;
  about?: string;
  price: string | number | null;
  category: string;
  image_url?: string;
  rating?: number;
}

export default function CategoryPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  // review form state
  const [reviewingProductId, setReviewingProductId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [existingReviews, setExistingReviews] = useState<any[]>([]);

  const categoryName = typeof slug === 'string' ? slug.replace(/-/g, ' ').toUpperCase() : 'Category';
  const categorySlug = typeof slug === 'string' ? slug.replace(/-/g, ' ') : '';

  useEffect(() => {
    // Check auth status
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };
    checkAuth();
  }, []);

  const handleAddToCart = async (productId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setAddingToCart(productId);
    try {
      await addToCart(user.email, productId, 1);
      alert('Item added to cart!');
      router.push('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      console.log('Fetched products from API:', data);
      
      // Filter products by category
      const filtered = data.filter((p: Product) => 
        p.category.toLowerCase() === categorySlug.toLowerCase()
      );
      console.log('Filtered products for category:', categorySlug, filtered);
      setProducts(filtered);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categorySlug) {
      fetchProducts();
    }
  }, [categorySlug]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 md:px-8 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2">{categoryName}</h1>
          <p className="text-base sm:text-lg text-gray-600">Browse our collection</p>
        </div>

        {/* Filters and Sort - Mobile Friendly */}
        <div className="bg-white text-gray-700 rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option>Newest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Most Popular</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range</label>
              <input type="range" min="0" max="1000" className="w-full" />
            </div>
          </div>
        </div>

        {/* Products Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {loading ? (
            <p className="text-gray-500">Loading products...</p>
          ) : products.length > 0 ? (
            products.map((p) => (
              <div key={p.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="h-40 sm:h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    'Image'
                  )}
                </div>
                <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
                      {p.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {p.about || p.description || 'No description available'}
                    </p>
                    <div className="flex items-center mb-3">
                      <span className="text-yellow-500 mr-1">
                        {'★'.repeat(Math.floor(p.rating || 3))}
                        {(p.rating || 3) % 1 ? '☆' : ''}
                      </span>
                      <span className="text-gray-500 text-xs">{(p.rating || 3).toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-bold text-orange-600">
                      {String(p.price || '£0.00')}
                    </span>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleAddToCart(p.id.toString())}
                        disabled={addingToCart === p.id.toString()}
                        className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition"
                      >
                        {addingToCart === p.id.toString() ? 'Adding...' : 'Add to Cart'}
                      </button>
                      {user ? (
                        <button
                          onClick={async () => {
                            setReviewingProductId(p.id.toString());
                            try {
                              const rv = await fetch(`/api/reviews?product_id=${p.id.toString()}`);
                              if (rv.ok) {
                                const json = await rv.json();
                                setExistingReviews(json || []);
                              } else {
                                setExistingReviews([]);
                              }
                            } catch (err) {
                              console.error('Failed to fetch existing reviews', err);
                              setExistingReviews([]);
                            }
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition"
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push('/login')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition"
                        >
                          Login to Review
                        </button>
                      )}
                    </div>
                    {reviewingProductId === p.id.toString() && (
                      <div className="mt-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                        {existingReviews.length > 0 && (
                          <div className="mb-2">
                            <h4 className="text-sm font-semibold">Previous Reviews</h4>
                            <div className="space-y-1">
                              {existingReviews.map((r) => (
                                <div key={r.id} className="text-xs text-gray-700">
                                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} {r.comment || ''}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <label className="block text-sm font-medium text-gray-700">Rating</label>
                        <select
                          value={reviewRating}
                          onChange={(e) => setReviewRating(Number(e.target.value))}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                        >
                          {[1,2,3,4,5].map((n) => (
                            <option key={n} value={n}>{n} star{n>1? 's': ''}</option>
                          ))}
                        </select>
                        <label className="block text-sm font-medium text-gray-700 mt-2">Comment (optional)</label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                if (!user) {
                                router.push('/login');
                                return;
                              }
                              const res = await fetch('/api/reviews', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    product_id: p.id,
                                    rating: reviewRating,
                                    comment: reviewComment,
                                    customer_id: user.id,
                                  }),
                                });
                                if (!res.ok) throw new Error('Failed to submit review');
                                alert('Thank you for your review!');
                                setReviewingProductId(null);
                                setReviewRating(5);
                                setReviewComment('');
                                // refresh product list to update rating
                                fetchProducts();
                              } catch (err) {
                                console.error(err);
                                alert('Error submitting review');
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => setReviewingProductId(null)}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No products found in this category.</p>
          )}
        </div>
      </div>
    </div>
  );
}