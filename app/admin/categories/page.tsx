"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "../../components/AdminNavbar";
import { HomeIcon, UserGroupIcon, ShoppingCartIcon, CubeIcon, CreditCardIcon, ChartBarIcon, StarIcon, GiftIcon, BellIcon, EnvelopeIcon, CogIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { fetchCategories, createCategory, deleteCategory, updateCategory, type Category } from "../../../lib/supabaseService";

// defaultCategories now fetched from DB

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>(["All Categories"]);
  const [newCategory, setNewCategory] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/verify-session")
      .then((res) => {
        if (!res.ok) {
          router.push("/admin/login");
        } else {
          setSessionChecked(true);
        }
      })
      .catch(() => {
        router.push("/admin/login");
      });
  }, [router]);

  useEffect(() => {
    const loadCats = async () => {
      const cats = await fetchCategories();
      setCategories(cats.map((c) => c.name));
    };
    if (sessionChecked) loadCats();
  }, [sessionChecked]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const name = newCategory.trim();
    if (!name) {
      setMessage("Category name cannot be empty.");
      return;
    }
    if (categories.includes(name)) {
      setMessage("Category already exists.");
      return;
    }

    try {
      const created = await createCategory({ name });
      if (created) {
        setCategories([...categories, created.name]);
        setNewCategory("");
        setMessage("Category added successfully!");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error creating category");
    }

    setTimeout(() => setMessage(""), 3000);
  };

  const handleDeleteCategory = async (categoryName: string) => {
    try {
      await deleteCategory(categoryName);
      setCategories(categories.filter((cat) => cat !== categoryName));
      setMessage(`${categoryName} deleted.`);
    } catch (err) {
      console.error(err);
      setMessage("Error deleting category");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  if (!sessionChecked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar onMenuToggle={setMobileMenuOpen} />

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 text-gray-800 bg-white border-r border-gray-200 p-4 hidden md:flex md:flex-col">
          <h2 className="text-lg font-semibold mb-6">Menu</h2>
          <nav className="space-y-3 text-gray-700 text-base">
            <a href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition"><HomeIcon className="h-5 w-5" />Dashboard Overview</a>
            <a href="/admin/customers" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition"><UserGroupIcon className="h-5 w-5" />Customers</a>
            <a href="/admin/orders" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition"><ShoppingCartIcon className="h-5 w-5" />Orders</a>
            <a href="/admin/products" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition"><CubeIcon className="h-5 w-5" />Products</a>
            <a href="/admin/categories" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium bg-gray-100 transition"><TagIcon className="h-5 w-5" />Categories</a>
            <a href="/admin/transactions" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition"><CreditCardIcon className="h-5 w-5" />Transactions</a>
            <a href="/admin/analytics" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition"><ChartBarIcon className="h-5 w-5" />Analytics</a>
            <a href="/admin/reviews" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition"><StarIcon className="h-5 w-5" />Reviews</a>
            <a href="/admin/promotions" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition"><GiftIcon className="h-5 w-5" />Promotions</a>
            <a href="/admin/notifications" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition"><BellIcon className="h-5 w-5" />Notifications</a>
            <a href="/admin/messages" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition"><EnvelopeIcon className="h-5 w-5" />Messages</a>
            <a href="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition"><CogIcon className="h-5 w-5" />Settings</a>
          </nav>
        </aside>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col shadow-lg">
              <h2 className="text-lg font-semibold mb-6">Menu</h2>
              <nav className="space-y-3 text-gray-700 text-base flex-1">
                <a href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition" onClick={() => setMobileMenuOpen(false)}><HomeIcon className="h-5 w-5" />Dashboard Overview</a>
                <a href="/admin/customers" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition" onClick={() => setMobileMenuOpen(false)}><UserGroupIcon className="h-5 w-5" />Customers</a>
                <a href="/admin/orders" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition" onClick={() => setMobileMenuOpen(false)}><ShoppingCartIcon className="h-5 w-5" />Orders</a>
                <a href="/admin/products" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition" onClick={() => setMobileMenuOpen(false)}><CubeIcon className="h-5 w-5" />Products</a>
                <a href="/admin/categories" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium bg-gray-100 transition" onClick={() => setMobileMenuOpen(false)}><TagIcon className="h-5 w-5" />Categories</a>
                <a href="/admin/transactions" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition" onClick={() => setMobileMenuOpen(false)}><CreditCardIcon className="h-5 w-5" />Transactions</a>
                <a href="/admin/analytics" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition" onClick={() => setMobileMenuOpen(false)}><ChartBarIcon className="h-5 w-5" />Analytics</a>
                <a href="/admin/reviews" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition" onClick={() => setMobileMenuOpen(false)}><StarIcon className="h-5 w-5" />Reviews</a>
                <a href="/admin/promotions" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition" onClick={() => setMobileMenuOpen(false)}><GiftIcon className="h-5 w-5" />Promotions</a>
                <a href="/admin/notifications" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition" onClick={() => setMobileMenuOpen(false)}><BellIcon className="h-5 w-5" />Notifications</a>
                <a href="/admin/messages" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition" onClick={() => setMobileMenuOpen(false)}><EnvelopeIcon className="h-5 w-5" />Messages</a>
                <a href="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition" onClick={() => setMobileMenuOpen(false)}><CogIcon className="h-5 w-5" />Settings</a>
              </nav>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="bg-white border-b">
            <div className="px-8 py-8">
              <h1 className="text-4xl font-bold text-gray-900">Categories</h1>
              <p className="text-gray-500 mt-1">Manage product categories.</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="max-w-2xl">
              {/* Add Category Form */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Category</h2>

                {message && (
                  <div
                    className={`mb-4 p-3 rounded ${
                      message.includes("successfully") || message.includes("deleted")
                        ? "bg-green-50 border border-green-200 text-green-700"
                        : "bg-red-50 border border-red-200 text-red-700"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <form onSubmit={handleAddCategory} className="flex gap-3">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter category name..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Add
                  </button>
                </form>
              </div>

              {/* Categories List */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Existing Categories</h2>

                {categories.length === 0 ? (
                  <p className="text-gray-500">No categories found. Add one to get started!</p>
                ) : (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="font-medium text-gray-900">{category}</span>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// TagIcon from heroicons
function TagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L9.09 3.659A2.25 2.25 0 007.568 3m0 0H.75m0 0v18"
      />
    </svg>
  );
}
