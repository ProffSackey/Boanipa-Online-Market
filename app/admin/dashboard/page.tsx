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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
      <form onSubmit={addCategory} className="mb-4">
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category"
          className="border px-2 py-1 mr-2"
        />
        <button className="bg-blue-600 text-white px-3 py-1 rounded">Add</button>
      </form>
      <ul className="space-y-2">
        {categories.map((cat) => (
          <li key={cat} className="flex items-center space-x-2">
            {editing === cat ? (
              <>
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="border px-2 py-1"
                />
                <button
                  onClick={() => updateCategory(cat)}
                  className="text-green-600"
                >
                  save
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="text-red-600"
                >
                  cancel
                </button>
              </>
            ) : (
              <>
                <span>{cat}</span>
                <button
                  onClick={() => {
                    setEditing(cat);
                    setEditValue(cat);
                  }}
                  className="text-blue-600"
                >
                  edit
                </button>
                <button
                  onClick={() => deleteCategory(cat)}
                  className="text-red-600"
                >
                  delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}