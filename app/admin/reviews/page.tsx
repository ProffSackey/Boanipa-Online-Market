"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "../../components/AdminNavbar";
import { MagnifyingGlassIcon, FunnelIcon, HomeIcon, UserGroupIcon, ShoppingCartIcon, CubeIcon, CreditCardIcon, ChartBarIcon, StarIcon, GiftIcon, BellIcon, EnvelopeIcon, CogIcon } from "@heroicons/react/24/outline";

interface Review {
  id: string;
  customer: string;
  email: string;
  product: string;
  rating: number;
  comment: string;
  status: "Approved" | "Pending" | "Rejected";
  date: string;
}

// placeholder for reviews, will be fetched from server
const mockReviews: Review[] = [];

const statusColors: Record<string, { bg: string; text: string }> = {
  Approved: { bg: "bg-green-100", text: "text-green-600" },
  Pending: { bg: "bg-yellow-100", text: "text-yellow-600" },
  Rejected: { bg: "bg-red-100", text: "text-red-600" },
};

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? "text-yellow-400 text-lg" : "text-gray-300 text-lg"}>
          ★
        </span>
      ))}
    </div>
  );
};

export default function ReviewsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    // after verifying admin session, load reviews
    const loadReviews = async () => {
      try {
        const res = await fetch('/api/admin/reviews');
        if (!res.ok) {
          console.error('Failed to fetch admin reviews', await res.text());
          return;
        }
        const data = await res.json();
        // map supabase join result into our Review interface
        const mapped: Review[] = (data || []).map((r: any) => ({
          id: r.id,
          customer: r.customers?.email || 'Unknown',
          email: r.customers?.email || 'Unknown',
          product: r.products?.name || r.product_id || 'Unknown',
          rating: r.rating,
          comment: r.comment,
          status: 'Approved',
          date: new Date(r.created_at).toLocaleDateString(),
        }));
        setReviews(mapped);
      } catch (err) {
        console.error('Error loading reviews', err);
      }
    };
    if (sessionChecked) {
      loadReviews();
    }
  }, [sessionChecked]);

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

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const handleApprove = (reviewId: string) => {
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
        review.id === reviewId ? { ...review, status: "Approved" } : review
      )
    );
  };

  const handleReject = (reviewId: string) => {
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
        review.id === reviewId ? { ...review, status: "Rejected" } : review
      )
    );
  };

  if (!sessionChecked) {
    return null;
  }

  const statuses = ["All Status", "Approved", "Pending", "Rejected"];

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.product.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === "All Status" || review.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen text-gray-800 bg-gray-50">
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
            <a href="/admin/transactions" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition"><CreditCardIcon className="h-5 w-5" />Transactions</a>
            <a href="/admin/analytics" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition"><ChartBarIcon className="h-5 w-5" />Analytics</a>
            <a href="/admin/reviews" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium bg-gray-100 transition"><StarIcon className="h-5 w-5" />Reviews</a>
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
                <a href="/admin/transactions" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition" onClick={() => setMobileMenuOpen(false)}><CreditCardIcon className="h-5 w-5" />Transactions</a>
                <a href="/admin/analytics" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition" onClick={() => setMobileMenuOpen(false)}><ChartBarIcon className="h-5 w-5" />Analytics</a>
                <a href="/admin/reviews" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium bg-gray-100 transition" onClick={() => setMobileMenuOpen(false)}><StarIcon className="h-5 w-5" />Reviews</a>
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
          <div className="bg-white">
            <div className="px-4 py-8">
              <h1 className="text-4xl font-bold text-gray-900">Reviews</h1>
              <p className="text-gray-500 mt-1">Manage and moderate customer product reviews.</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white px-4 py-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-600"
                />
              </div>

              {/* Status Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <FunnelIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">{selectedStatus}</span>
                </button>

                {showStatusDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                    {statuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setSelectedStatus(status);
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center ${
                          selectedStatus === status ? "font-semibold" : ""
                        }`}
                      >
                        {selectedStatus === status && <span className="mr-2">✓</span>}
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="m-4 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full bg-white">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Rating</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">
                    Comment
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review) => (
                  <tr key={review.id} className=" hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{review.customer}</div>
                      <div className="text-gray-500 text-xs">{review.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{review.product}</td>
                    <td className="px-6 py-4 text-sm">
                      <StarRating rating={review.rating} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs text-center line-clamp-2">
                      {review.comment}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full font-medium text-xs ${statusColors[review.status].bg} ${statusColors[review.status].text}`}
                      >
                        {review.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{review.date}</td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      {review.status === "Pending" ? (
                        <>
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-medium transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(review.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-medium transition"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-500 text-xs">{review.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReviews.length === 0 && (
            <div className="m-4 rounded-lg shadow-sm p-8 text-center text-gray-500 bg-white">
              No reviews found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
