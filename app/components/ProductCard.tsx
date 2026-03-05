"use client";

import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Promotion as UIPromotion, getProductPromotions, calculateDiscount } from '../../lib/promotionUtils';
import type { Product } from '../../lib/supabaseService';

interface Props {
  product: Product;
  promotions?: UIPromotion[];
  user?: any;
  addingToCart?: string | null;
  onAddToCart: (id: string) => void;
}

export default function ProductCard({ product: p, promotions = [], user, addingToCart, onAddToCart }: Props) {
  const promotion = getProductPromotions(p.id || '', promotions);
  const discount = promotion ? calculateDiscount(p.price, promotion) : null;

  const stock = p.stock_quantity ?? 0;
  const stockThreshold = 100; // used to calculate progress bar percentage
  const stockPercent = Math.min(100, Math.round((stock / stockThreshold) * 100));
  const stockColor = stock <= 5 ? 'bg-red-500' : stock <= 20 ? 'bg-orange-500' : 'bg-yellow-400';

  const [open, setOpen] = useState(false);

  // recommended products placeholder (no related_products field on Product)
  const recommended: Product[] = [];

  return (
    <>
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image Container - Responsive height */}
      <div className="h-64 sm:h-80 lg:h-72 xl:h-60 bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          'Image'
        )}
      </div>

      {/* Content Container - Responsive height */}
      <div className="p-4 sm:p-5 flex flex-col justify-between min-h-[100px] sm:min-h-[110px] lg:min-h-[90px] xl:min-h-[85px]">
        {/* Header Section */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 line-clamp-2">
            {p.name}
          </h3>

          <div className="flex items-center justify-between mb-2 gap-2">
            <p className="text-gray-600 text-xs sm:text-sm truncate flex-1">
              {p.about || p.description || 'Quality product'}
            </p>
            <button
              onClick={() => setOpen(true)}
              className="text-xs text-orange-600 ml-2 hover:underline whitespace-nowrap"
              aria-label="Read more about product"
            >
              Read more
            </button>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <span className="text-yellow-400 text-base">
              {'\u2605'.repeat(Math.floor((p.rating && p.rating > 0) ? p.rating : 3))}
              {((p.rating && p.rating > 0) ? p.rating : 3) % 1 ? '\u2606' : ''}
            </span>
            <span className="text-gray-600 font-medium text-xs">{((p.rating && p.rating > 0) ? p.rating : 3).toFixed(1)}</span>
          </div>

          {/* Stock status indicator */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700">{stock} items left</span>
              <button
                aria-label="Message about this product"
                onClick={() => {
                  if (typeof window !== 'undefined' && p.id) {
                    window.location.href = `/messages?productId=${p.id}`;
                  }
                }}
                className="ml-2 text-gray-600 hover:text-orange-600"
              >
                <EnvelopeIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div className={`${stockColor} h-2 rounded-full`} style={{ width: `${stockPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Footer Section with Price and Button */}
        <div className="flex flex-col gap-2">
          {/* Price Section */}
          {discount ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-500 line-through">
                  {discount.formatted.original || '£0.00'}
                </span>
                <span className="text-xl sm:text-2xl lg:text-xl xl:text-lg font-bold text-orange-600">
                  {discount.formatted.discounted || '£0.00'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-semibold">
                  Save {discount.savingsPercent.toFixed(0)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="text-2xl sm:text-3xl lg:text-2xl xl:text-xl font-bold text-orange-600 leading-none">
              {p.price || '£0.00'}
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={() => onAddToCart(p.id?.toString() || '')}
            disabled={addingToCart === p.id || !p.price || (p.stock_quantity !== undefined && p.stock_quantity <= 0)}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-3 py-2 sm:py-3 lg:py-2 xl:py-1.5 rounded-lg text-sm sm:text-base lg:text-sm xl:text-xs font-bold transition-colors"
          >
            {addingToCart === p.id ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>

    {/* Modal */}
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
          <div className="p-4 border-b flex items-start justify-between">
            <div className="flex items-start gap-4">
              <img src={p.image_url} alt={p.name} className="w-20 h-20 object-cover rounded-md" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                <p className="text-sm text-gray-600">{p.about || p.description}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Product details</h4>
              <p className="text-sm text-gray-700 mb-4">{p.description || p.about || 'No further details available.'}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { onAddToCart(p.id?.toString() || ''); setOpen(false); }}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium"
                >
                  Add to cart
                </button>
                <button
                  onClick={() => { if (typeof window !== 'undefined' && p.id) window.location.href = `/messages?productId=${p.id}`; }}
                  className="border border-orange-500 text-orange-600 px-4 py-2 rounded-md font-medium hover:bg-orange-50"
                >
                  Chat now
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Recommended products</h4>
              <div className="space-y-2">
                {recommended.length > 0 ? (
                  recommended.slice(0,3).map((r) => (
                    <div key={r.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50">
                      <img src={r.image_url} alt={r.name} className="w-12 h-12 object-cover rounded" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{r.name}</div>
                        <div className="text-xs text-gray-600">{r.price}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-600">No recommendations available.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
