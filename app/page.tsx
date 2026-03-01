"use client";

import { useEffect, useState } from 'react';
import Image from "next/image";
import HeroCarousel from "./components/HeroCarousel";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  rating?: number;
}

export default function Home() {
  const [categories, setCategories] = useState<string[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [newStockProducts, setNewStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // rename legacy category if present
          const normalized = data.map((c: string) =>
            c === 'Electronics & Computing' ? 'grocessories' : c
          );
          setCategories(normalized);
        }
      })
      .catch(console.error);

    // Fetch trending products (first 6 products)
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTrendingProducts(data.slice(0, 6));
          // Get new stock products (6-12 or remaining)
          setNewStockProducts(data.slice(6, 12));
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <HeroCarousel />

      {/* Featured Categories - Hidden on mobile */}
      <div className="hidden text-gray-700 md:block px-4 sm:px-6 md:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8">Featured Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.length > 0 ? (
            categories.slice(0, 3).map((cat, idx) => (
              <div key={cat + idx} className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition">
                <div className="h-40 sm:h-48 bg-gray-200 rounded mb-4"></div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">{cat}</h3>
                <p className="text-sm sm:text-base text-gray-600">Browse our latest products</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Loading categories...</p>
          )}
        </div>
      </div>

      {/* Trending Products */}
      <div className="px-4 sm:px-6 text-gray-700 md:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8">Trending Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {trendingProducts.length > 0 ? (
            trendingProducts.map((p) => (
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
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-bold text-orange-600">
                      ${p.price.toFixed(2)}
                    </span>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No trending products available yet.</p>
          )}
        </div>
      </div>

      {/* New Stock Alert */}
      <div className="px-4 sm:px-6 text-gray-700 md:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">New Stock Alert</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {newStockProducts.length > 0 ? (
            newStockProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="h-40 sm:h-48 bg-gray-200 flex items-center justify-center text-gray-500 relative">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    'Image'
                  )}
                  <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs sm:text-sm font-bold">NEW</div>
                </div>
                <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
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
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-bold text-orange-600">
                      ${p.price.toFixed(2)}
                    </span>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No new stock available yet.</p>
          )}
        </div>
      </div>

      {/* Featured Products */}
      <div className="px-4 sm:px-6 text-gray-700 md:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {trendingProducts.length > 0 ? (
            trendingProducts.slice(0, 8).map((p) => (
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
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-bold text-orange-600">
                      ${p.price.toFixed(2)}
                    </span>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No featured products available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
