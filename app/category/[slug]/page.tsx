"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  rating?: number;
}

export default function CategoryPage() {
  const { slug } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const categoryName = typeof slug === 'string' ? slug.replace(/-/g, ' ').toUpperCase() : 'Category';
  const categorySlug = typeof slug === 'string' ? slug.replace(/-/g, ' ') : '';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/admin/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        
        // Filter products by category
        const filtered = data.filter((p: Product) => 
          p.category.toLowerCase() === categorySlug.toLowerCase()
        );
        setProducts(filtered);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (categorySlug) {
      fetchProducts();
    }
  }, [categorySlug]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 md:px-8 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">{categoryName}</h1>
          <p className="text-base sm:text-lg text-gray-600">Browse our collection</p>
        </div>

        {/* Filters and Sort - Mobile Friendly */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
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
                      {p.description || 'No description available'}
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
            <p className="text-gray-500">No products found in this category.</p>
          )}
        </div>
      </div>
    </div>
  );
}