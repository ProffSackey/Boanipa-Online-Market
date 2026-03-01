"use client";

import { useParams } from 'next/navigation';

export default function CategoryPage() {
  const { slug } = useParams();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Category: {slug}</h1>
      <p>Products for this category would appear here.</p>
    </div>
  );
}