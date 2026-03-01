"use client";

import { useState, FormEvent } from 'react';

interface Props {
  refreshCategories: () => void;
  categories?: string[];
  onSuccess?: () => void;
}

export default function UploadProductForm({ refreshCategories, categories = [], onSuccess }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, price: parseFloat(price), category, image_url: imageUrl }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Upload failed');
    } else {
      setMessage('Product added');
      setName('');
      setDescription('');
      setPrice('');
      setCategory('');
      setImageUrl('');
      refreshCategories();
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
      <h2 className="text-lg font-bold mb-4">Add New Product</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
          className="border px-3 py-2 rounded"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="border px-3 py-2 rounded"
          rows={3}
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          type="number"
          step="0.01"
          className="border px-3 py-2 rounded"
          required
        />
        {categories && categories.length > 0 ? (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border px-3 py-2 rounded"
            required
          >
            <option value="">Select category</option>
            {categories.map((c: string) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="border px-3 py-2 rounded"
            required
          />
        )}
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Image URL"
          className="border px-3 py-2 rounded"
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Upload
        </button>
        {message && <p className="text-sm mt-2">{message}</p>}
      </form>
    </div>
  );
}