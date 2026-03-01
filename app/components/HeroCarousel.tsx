"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Slide = {
  id: number;
  title: string;
  subtitle: string;
  cta?: string;
};

export default function HeroCarousel() {
  const slides: Slide[] = [
    { id: 1, title: "Welcome to BOANIPA", subtitle: "Your one-stop online marketplace", cta: "Start Shopping" },
    { id: 2, title: "Discover Great Deals", subtitle: "Daily discounts across categories", cta: "Shop Deals" },
    { id: 3, title: "Fast Delivery", subtitle: "Reliable shipping to your doorstep", cta: "Browse Products" },
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative overflow-hidden px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20 max-w-7xl mx-auto">
      <div className="relative h-48 sm:h-60 md:h-72 lg:h-[28rem] xl:h-[40rem]">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 flex items-center justify-center text-center transition-opacity duration-700 ease-in-out ${
              i === index ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* background image for specific slide */}
            {s.id === 3 && (
              <div className="absolute inset-0">
                <Image
                  src="/fastdelivery.jpeg"
                  alt="Fast Delivery"
                  fill
                  style={{ objectFit: "cover" }}
                  className="object-cover"
                />
              </div>
            )}

            {/* subtle overlay for readability */}
            <div className="absolute inset-0 bg-black/10" />

            <div className="relative z-10 flex flex-col items-center justify-center px-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3">{s.title}</h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-200 mb-6">{s.subtitle}</p>
              {s.cta && (
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold transition">
                  {s.cta}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* indicators */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {slides.map((s, i) => (
          <button
            key={s.id}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`w-3 h-3 rounded-full transition-all ${i === index ? "bg-orange-500 w-6" : "bg-gray-300"}`}
          />
        ))}
      </div>
    </div>
  );
}
