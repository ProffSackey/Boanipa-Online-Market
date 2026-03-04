"use client";

import { useEffect, useState } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import HeroCarousel from "./components/HeroCarousel";
import { fetchPromotions, type Promotion as SupabasePromotion, type Product, addToCart } from '../lib/supabaseService';
import { supabase } from '@/lib/supabaseClient';
import { Promotion as UIPromotion, getProductPromotions, calculateDiscount, getFeaturedPromotions, getDiscountBadgeText, formatPrice, parsePrice } from '../lib/promotionUtils';

export default function Home() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [promotions, setPromotions] = useState<UIPromotion[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [newStockProducts, setNewStockProducts] = useState<Product[]>([]);
  const [featuredPromotions, setFeaturedPromotions] = useState<UIPromotion[]>([]);
  const [user, setUser] = useState<any>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const categoryImages: Record<string, string> = {
    Appliances: "/appliances.jpeg",
    Grocessories: "/grocessories.jpeg",
    "Health & Beauty": "/This health.jpeg",
  };

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

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load promotions from Supabase
        const promos = await fetchPromotions();
        setPromotions(promos);
        setFeaturedPromotions(getFeaturedPromotions(promos));

        // Load products from API endpoint (uses service role for proper RLS permissions)
        const res = await fetch('/api/admin/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const prods = await res.json();
        setTrendingProducts(prods.slice(0, 6));
        setNewStockProducts(prods.slice(6, 12));
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    // Fetch categories
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const normalized = data.map((c: string) =>
            c === 'Electronics & Computing' ? 'Grocessories' : c
          );
          setCategories(normalized);
        }
      })
      .catch(console.error);

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <HeroCarousel />

      {/* Featured Promotions Section */}
      {featuredPromotions.length > 0 && (
        <div id="promotions" className="px-4 sm:px-6 md:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-800">Special Offers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {featuredPromotions.slice(0, 3).map((promo) => (
              <div
                key={promo.id}
                className="bg-gradient-to-br from-orange-400 to-red-500 rounded-lg shadow-lg p-6 sm:p-8 text-white hover:shadow-xl transition transform hover:scale-105"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">{promo.name}</h3>
                    <p className="text-sm sm:text-base opacity-90">{promo.description}</p>
                  </div>
                </div>

                {/* Discount Badge */}
                <div className="bg-white text-red-600 inline-block px-4 py-2 rounded-full font-bold text-lg mb-4 shadow-md">
                  {getDiscountBadgeText(promo)}
                </div>

                {/* Product Count and Code */}
                <div className="mt-6 pt-6 border-t border-white border-opacity-30">
                  <p className="text-sm sm:text-base mb-3">
                      💰 {(promo.product_ids || []).length} Products on Sale
                  </p>
                  <p className="text-xs sm:text-sm bg-white bg-opacity-20 inline-block px-3 py-2 rounded font-mono">
                    Code: <span className="font-bold">{promo.code}</span>
                  </p>
                </div>

                {/* View Products Button */}
                <button className="w-full mt-6 bg-white text-red-600 font-bold py-2 px-4 rounded-lg hover:bg-orange-100 transition">
                  View Products →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Categories - Hidden on mobile */}
      <div className="hidden text-gray-700 md:block px-4 sm:px-6 md:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-2xl md:text-2xl font-bold mb-6 sm:mb-8">Featured Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.length > 0 ? (
            categories.slice(0, 3).map((cat, idx) => (
              <div key={cat + idx} className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition">
                <div className="h-40 sm:h-48 bg-gray-200 rounded mb-4 overflow-hidden">
                  {categoryImages[cat] && (
                    <Image
                      src={categoryImages[cat]}
                      alt={cat}
                      width={400}
                      height={320}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                <h3 className="text-base sm:text-base md:text-base font-semibold mb-2">{cat}</h3>
                <p className="text-sm sm:text-base text-gray-600">Browse our latest products</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Loading categories...</p>
          )}
        </div>
      </div>

      {/* Trending Products */}
      <div id="featured-products" className="px-4 sm:px-6 text-gray-700 md:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8">Trending Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {trendingProducts.length > 0 ? (
            trendingProducts.map((p) => {
              const promotion = getProductPromotions(p.id || '', promotions);
              const discount = promotion ? calculateDiscount(p.price, promotion) : null;
              
              return (
              <div key={p.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition relative">
                {/* Promotion Badge */}
                {discount && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-bold z-10">
                    {getDiscountBadgeText(promotion!)}
                  </div>
                )}
                
                <div className="h-40 sm:h-48 bg-gray-200 flex items-center justify-center text-gray-500 relative">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    'Image'
                  )}
                </div>
                <div className="p-4 sm:p-5 flex flex-col justify-between min-h-[280px]">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
                      {p.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {p.description || 'Quality product'}
                    </p>
                    <div className="flex items-center mb-3">
                      <span className="text-yellow-500 mr-1">
                        {'\u2605'.repeat(Math.floor(p.rating || 0))}
                        {(p.rating || 0) % 1 ? '\u2606' : ''}
                      </span>
                      <span className="text-gray-500 text-xs">{(p.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col mt-auto">
                    {/* price display with fallback */}
                    {discount ? (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs sm:text-sm text-gray-500 line-through">
                            {discount.formatted.original || '£0.00'}
                          </span>
                          <span className="text-lg sm:text-xl font-bold text-green-600">
                            {discount.formatted.discounted || '£0.00'}
                          </span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Save {discount.savingsPercent.toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Code: <span className="font-semibold">{promotion?.code}</span></p>
                      </>
                    ) : (
                      <span className="text-lg sm:text-xl font-bold text-orange-600 mb-3">
                        {p.price || '£0.00'}
                      </span>
                    )}
                    {/* show add to cart unless out of stock or price missing */}
                    <button 
                      onClick={() => handleAddToCart(p.id || '')}
                      disabled={addingToCart === p.id || !p.price || (p.stock_quantity !== undefined && p.stock_quantity <= 0)}
                      className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition"
                    >
                      {addingToCart === p.id ? 'Adding...' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            );
            })
          ) : (
            <p className="text-gray-500">No trending products available yet.</p>
          )}
        </div>
      </div>

      {/* New Stock Alert */}
      <div className="px-4 sm:px-6 text-gray-700 md:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold">New Stock Alert</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {newStockProducts.length > 0 ? (
            newStockProducts.map((p) => {
              const promotion = getProductPromotions(p.id || '', promotions);
              const discount = promotion ? calculateDiscount(p.price, promotion) : null;

              return (
              <div key={p.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="h-40 sm:h-48 bg-gray-200 flex items-center justify-center text-gray-500 relative">
                  {promotion && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-bold">
                      {getDiscountBadgeText(promotion)}
                    </div>
                  )}
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    'Image'
                  )}
                  <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs sm:text-sm font-bold">NEW</div>
                </div>
                <div className="p-4 sm:p-5 flex flex-col justify-between min-h-[280px]">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
                      {p.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {p.description || 'Quality product'}
                    </p>
                    <div className="flex items-center mb-3">
                      <span className="text-yellow-500 mr-1">
                        {'★'.repeat(Math.floor(p.rating || 0))}
                        {(p.rating || 0) % 1 ? '☆' : ''}
                      </span>
                      <span className="text-gray-500 text-xs">{(p.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="mt-auto">
                    {discount ? (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm text-gray-500 line-through">
                            {discount.formatted.original || '£0.00'}
                          </span>
                          <span className="text-lg sm:text-xl font-bold text-green-600">
                            {discount.formatted.discounted || '£0.00'}
                          </span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Save {discount.savingsPercent.toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Code: <span className="font-semibold">{promotion?.code}</span></p>
                      </>
                    ) : (
                      <span className="text-lg sm:text-xl font-bold text-orange-600 mb-3 block">
                        {p.price || '£0.00'}
                      </span>
                    )}
                    <button 
                      onClick={() => handleAddToCart(p.id || '')}
                      disabled={addingToCart === p.id || !p.price || (p.stock_quantity !== undefined && p.stock_quantity <= 0)}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition"
                    >
                      {addingToCart === p.id ? 'Adding...' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            );
            })
          ) : (
            <p className="text-gray-500">No new stock available yet.</p>
          )}
        </div>
      </div>

      {/* Featured Products */}
      <div className="px-4 sm:px-6 text-gray-700 md:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {trendingProducts.length > 0 ? (
            trendingProducts.slice(0, 8).map((p) => {
              return (
              <div key={p.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="h-40 sm:h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    'Image'
                  )}
                </div>
                <div className="p-4 sm:p-5 flex flex-col justify-between min-h-[280px]">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
                      {p.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {p.description || 'Quality product'}
                    </p>
                    <div className="flex items-center mb-3">
                      <span className="text-yellow-500 mr-1">
                        {'\u2605'.repeat(Math.floor(p.rating || 0))}
                        {(p.rating || 0) % 1 ? '\u2606' : ''}
                      </span>
                      <span className="text-gray-500 text-xs">{(p.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="mt-auto">
                    {/* show add to cart unless out of stock or price missing */}
                    <button 
                      onClick={() => handleAddToCart(p.id || '')}
                      disabled={addingToCart === p.id || !p.price || (p.stock_quantity !== undefined && p.stock_quantity <= 0)}
                      className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition"
                    >
                      {addingToCart === p.id ? 'Adding...' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            );
            })
          ) : (
            <p className="text-gray-500">No featured products available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

