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
          {[
            {
              id: 1,
              name: 'Product 1',
              description: 'High quality product description',
              rating: 4.5,
              price: 99.99,
            },
            {
              id: 2,
              name: 'Product 2',
              description: 'Excellent craftsmanship',
              rating: 4.0,
              price: 79.5,
            },
            {
              id: 3,
              name: 'Product 3',
              description: 'Top seller in its category',
              rating: 5.0,
              price: 149.99,
            },
            {
              id: 4,
              name: 'Product 4',
              description: 'Limited time offer',
              rating: 3.8,
              price: 49.99,
            },
          ].map((p) => (
            <div key={p.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="h-40 sm:h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                Image
              </div>
              <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
                    {p.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {p.description}
                  </p>
                  <div className="flex items-center mb-3">
                    <span className="text-yellow-500 mr-1">
                      {'★'.repeat(Math.floor(p.rating))}
                      {p.rating % 1 ? '☆' : ''}
                    </span>
                    <span className="text-gray-500 text-xs">{p.rating.toFixed(1)}</span>
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
          ))}
        </div>
      </div>
    </div>
  );
}