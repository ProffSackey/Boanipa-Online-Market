"use client";

import { useParams } from 'next/navigation';

export default function CategoryPage() {
  const { slug } = useParams();
  
  const categoryName = typeof slug === 'string' ? slug.replace(/-/g, ' ').toUpperCase() : 'Category';

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 md:px-8 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">{categoryName}</h1>
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
          {[1, 2, 3, 4, 5, 6, 7, 8].map((product) => (
            <div key={product} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="h-40 sm:h-48 bg-gray-200"></div>
              <div className="p-4 sm:p-5">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 line-clamp-2">Product {product}</h3>
                <p className="text-gray-600 text-sm mb-3">High quality product description</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg sm:text-xl font-bold text-orange-600">$99.99</span>
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition">
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}