"use client";

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const fetchCats = () => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  };

  useEffect(() => {
    // Check if admin session cookie exists
    fetch('/api/admin/verify-session')
      .then((res) => {
        if (!res.ok) {
          router.push('/admin/login');
        }
      })
      .catch(() => router.push('/admin/login'));
    
    fetchCats();
  }, [router]);

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

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 md:px-8 py-6 sm:py-8">
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