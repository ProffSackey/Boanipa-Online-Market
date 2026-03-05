"use client";

import { useEffect, useState } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import HeroCarousel from "./components/HeroCarousel";
import { fetchPromotions, type Promotion as SupabasePromotion, type Product, addToCart } from '../lib/supabaseService';
import ProductCard from './components/ProductCard';
import { supabase } from '@/lib/supabaseClient';
import { Promotion as UIPromotion, getProductPromotions, calculateDiscount, getFeaturedPromotions, getDiscountBadgeText, formatPrice, parsePrice } from '../lib/promotionUtils';
import { addToGuestCart, subscribeToGuestCartChanges, subscribeToUserCartChanges } from '@/lib/cartUtils';
import { getUserCartCount } from '@/lib/supabaseService';

export default function Home() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [promotions, setPromotions] = useState<UIPromotion[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [newStockProducts, setNewStockProducts] = useState<Product[]>([]);
  const [featuredPromotions, setFeaturedPromotions] = useState<UIPromotion[]>([]);
  const [user, setUser] = useState<any>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
    // Find the product to get its details
    const product = [...trendingProducts, ...newStockProducts].find(p => p.id === productId);
    if (!product) {
      setNotice('Product not found');
      setTimeout(() => setNotice(null), 4000);
      return;
    }

    setAddingToCart(productId);
    try {
      if (!user) {
        // Add to guest cart and wait for cart update before showing confirmation
        addToGuestCart({
          productId: productId.toString(),
          quantity: 1,
          name: product.name,
          price: product.price.toString(),
          image_url: product.image_url,
        });

        let handled = false;
        const unsubscribe = subscribeToGuestCartChanges((count) => {
          if (handled) return;
          handled = true;
          try { unsubscribe(); } catch {};
          console.debug('[Cart] guest item added, count:', count);
        });
        // Fallback if event doesn't arrive in time
        setTimeout(() => { if (!handled) { handled = true; try { unsubscribe(); } catch {} console.debug('[Cart] guest add fallback'); } }, 1500);
      } else {
        // Add to user cart and wait for server-side cart update
        const cartResult = await addToCart(user.email, productId, 1);
        if (cartResult) {
          let handled = false;
          const unsubscribe = subscribeToUserCartChanges(user.email, () => {
            if (handled) return;
            handled = true;
            try { unsubscribe(); } catch {}
            console.debug('[Cart] user item added (realtime)');
          });
          // Also proactively fetch updated cart total and notify Navbar immediately
          try {
            const total = await getUserCartCount(user.email);
            try { window.dispatchEvent(new CustomEvent('userCartCountUpdated', { detail: { count: total } })); } catch {}
          } catch (e) { console.error('Failed to fetch user cart count after add:', e); }
          setTimeout(() => { if (!handled) { handled = true; try { unsubscribe(); } catch {} console.debug('[Cart] user add fallback'); } }, 1500);
        } else {
          console.warn('addToCart returned null - possible supabase error');
          setNotice('Could not add item to cart. It may be out of stock.');
          setTimeout(() => setNotice(null), 4000);
        }
      }
    } catch (error) {
      console.warn('Error adding to cart (caught):', error);
      setNotice('Failed to add item to cart. Please try again.');
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setAddingToCart(null);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch products');
      const prods = await res.json();
      setTrendingProducts(prods.slice(0, 6));
      setNewStockProducts(prods.slice(6, 12));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    // Helper to fetch products from the API (no cache)
    const fetchProductsFromApi = async () => {
      try {
        const res = await fetch('/api/admin/products', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch products');
        const prods = await res.json();
        setTrendingProducts(prods.slice(0, 6));
        setNewStockProducts(prods.slice(6, 12));
      } catch (error) {
        console.error('Error fetching products from API:', error);
      }
    };

    const loadData = async () => {
      try {
        // Load promotions from Supabase
        const promos = await fetchPromotions();
        setPromotions(promos);
        setFeaturedPromotions(getFeaturedPromotions(promos));

        // Load products via API (respects RLS and uses service key server-side)
        await fetchProducts();
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

  // Subscribe to Supabase realtime changes so products refresh automatically
  useEffect(() => {
    const channel = supabase
      .channel('products-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        // refetch latest products when any change occurs
        fetch('/api/admin/products', { cache: 'no-store' })
          .then((r) => r.ok ? r.json() : Promise.reject('fetch failed'))
          .then((prods) => {
            setTrendingProducts(prods.slice(0, 6));
            setNewStockProducts(prods.slice(6, 12));
          })
          .catch((err) => console.error('Realtime fetch error:', err));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <HeroCarousel />
      {notice && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-2 rounded">
            {notice}
          </div>
        </div>
      )}

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
      <div id="featured-products" className="px-4 sm:px-6 text-gray-700 md:px-8 py-8 mt-20 sm:py-12 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8">Trending Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {trendingProducts.length > 0 ? (
            trendingProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                promotions={promotions}
                user={user}
                addingToCart={addingToCart}
                onAddToCart={(id) => handleAddToCart(id || '')}
              />
            ))
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {newStockProducts.length > 0 ? (
            newStockProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                promotions={promotions}
                user={user}
                addingToCart={addingToCart}
                onAddToCart={(id) => handleAddToCart(id || '')}
              />
            ))
          ) : (
            <p className="text-gray-500">No new stock available yet.</p>
          )}
        </div>
      </div>

      {/* Featured Products */}
      <div className="px-4 sm:px-6 text-gray-700 md:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8">Featured Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {trendingProducts.length > 0 ? (
            trendingProducts.slice(0, 8).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                promotions={promotions}
                user={user}
                addingToCart={addingToCart}
                onAddToCart={(id) => handleAddToCart(id || '')}
              />
            ))
          ) : (
            <p className="text-gray-500">No featured products available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

