"use client";

import { useEffect, useState } from "react";

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
      <div className="relative h-40 sm:h-52 md:h-64 lg:h-80">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity duration-700 ease-in-out ${
              i === index ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-3">{s.title}</h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6">{s.subtitle}</p>
            {s.cta && (
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold transition">
                {s.cta}
              </button>
            )}
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
