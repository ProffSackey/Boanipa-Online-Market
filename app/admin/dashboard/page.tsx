"use client";

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import UploadProductForm from './UploadProductForm';

export default function AdminDashboard() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  // ensure we only show dashboard after verifying session
  const [sessionChecked, setSessionChecked] = useState(false);

  interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    category: string;
    image_url?: string;
    stock?: number;
  }
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productEdits, setProductEdits] = useState<Partial<Product>>({});

  const fetchCats = () => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  };

  const fetchProducts = () => {
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    // Check if admin session cookie exists
    fetch('/api/admin/verify-session')
      .then((res) => {
        if (!res.ok) {
          router.push('/admin/login');
        } else {
          setSessionChecked(true);
        }
      })
      .catch(() => {
        router.push('/admin/login');
      });
    
    if (sessionChecked) {
      fetchCats();
      fetchProducts();
    }
  }, [router, sessionChecked]);

  const addCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategory.trim() }),
    });
    setNewCategory('');
    fetchCats();
  };

  const updateCategory = async (oldName: string) => {
    if (!editValue.trim()) return;
    await fetch('/api/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldName, newName: editValue.trim() }),
    });
    setEditing(null);
    setEditValue('');
    fetchCats();
  };

  const deleteCategory = async (name: string) => {
    if (!confirm(`Remove category "${name}"?`)) return;
    await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    fetchCats();
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Remove this product?')) return;
    await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchProducts();
  };

  const updateProduct = async (id: number) => {
    if (editingProductId !== id) return;
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...productEdits }),
    });
    setEditingProductId(null);
    setProductEdits({});
    fetchProducts();
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (!sessionChecked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-4 hidden md:block">
        <h2 className="text-lg font-semibold mb-4">Menu</h2>
        <nav className="space-y-2 text-gray-700 text-sm">
          <a href="/admin/dashboard" className="block px-2 py-1 rounded hover:bg-gray-100">Dashboard Overview</a>
          <a href="/admin/users" className="block px-2 py-1 rounded hover:bg-gray-100">Users</a>
          <a href="/admin/orders" className="block px-2 py-1 rounded hover:bg-gray-100">Orders</a>
          <a href="/admin/products" className="block px-2 py-1 rounded hover:bg-gray-100">Products</a>
          <a href="/admin/transactions" className="block px-2 py-1 rounded hover:bg-gray-100">Transactions</a>
          <a href="/admin/analytics" className="block px-2 py-1 rounded hover:bg-gray-100">Analytics</a>
          <a href="/admin/reviews" className="block px-2 py-1 rounded hover:bg-gray-100">Reviews</a>
        </nav>
      </aside>

      <div className="flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage categories and products</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-3 sm:py-2 rounded-lg font-semibold transition duration-200"
            >
              Logout
            </button>
          </div>

          {/* Add Category Form */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Add New Category</h2>
          <form onSubmit={addCategory} className="flex flex-col sm:flex-row gap-3">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
            <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200">
              Add Category
            </button>
          </form>
        </div>

        {/* Upload Product Form */}
        <UploadProductForm
          refreshCategories={fetchCats}
          categories={categories}
          onSuccess={fetchProducts}
        />

        {/* Products List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Products</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {products.map((p) => (
              <li key={p.id} className="px-4 sm:px-6 py-4 sm:py-5 hover:bg-gray-50 transition">
                {editingProductId === p.id ? (
                  <div className="flex flex-col gap-3">
                    <input
                      value={productEdits.name || ''}
                      onChange={(e) => setProductEdits({ ...productEdits, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Name"
                    />
                    <textarea
                      value={productEdits.description || ''}
                      onChange={(e) => setProductEdits({ ...productEdits, description: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Description"
                      rows={2}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={productEdits.price !== undefined ? productEdits.price : ''}
                      onChange={(e) => setProductEdits({ ...productEdits, price: parseFloat(e.target.value) })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Price"
                    />
                    <select
                      value={productEdits.category || ''}
                      onChange={(e) => setProductEdits({ ...productEdits, category: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Category</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      value={productEdits.image_url || ''}
                      onChange={(e) => setProductEdits({ ...productEdits, image_url: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Image URL"
                    />
                    <input
                      type="number"
                      value={productEdits.stock !== undefined ? productEdits.stock : ''}
                      onChange={(e) => setProductEdits({ ...productEdits, stock: parseInt(e.target.value) })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Stock Quantity"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateProduct(p.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingProductId(null)}
                        className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className="font-semibold text-gray-800">
                      {p.name} – {p.category} – ${p.price} – Stock: {p.stock || 0}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProductId(p.id);
                          setProductEdits({
                            name: p.name,
                            description: p.description,
                            price: p.price,
                            category: p.category,
                            image_url: p.image_url,
                            stock: p.stock,
                          });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm sm:text-base"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm sm:text-base"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Categories</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {categories.map((cat) => (
              <li key={cat} className="px-4 sm:px-6 py-4 sm:py-5 hover:bg-gray-50 transition">
                {editing === cat ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateCategory(cat)}
                        className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="flex-1 sm:flex-none bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className="text-base sm:text-lg font-semibold text-gray-800">{cat}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditing(cat);
                          setEditValue(cat);
                        }}
                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCategory(cat)}
                        className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}