"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "../../components/AdminNavbar";
import { MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon, EyeIcon, EnvelopeIcon, EllipsisVerticalIcon, HomeIcon, UserGroupIcon, ShoppingCartIcon, CubeIcon, CreditCardIcon, ChartBarIcon, StarIcon, GiftIcon, BellIcon, CogIcon } from "@heroicons/react/24/outline";

import mockOrders, { Order } from "./mockOrders";

const statusColors: Record<string, { bg: string; text: string }> = {
  Delivered: { bg: "bg-blue-100", text: "text-blue-600" },
  Processing: { bg: "bg-gray-100", text: "text-gray-600" },
  Shipped: { bg: "bg-gray-100", text: "text-gray-600" },
  Cancelled: { bg: "bg-red-100", text: "text-red-600" },
};

const paymentColors: Record<string, string> = {
  Paid: "text-green-600",
  Refunded: "text-red-600",
  Pending: "text-yellow-600",
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState(mockOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
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
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handleStatusChange = (orderId: string, newStatus: "Delivered" | "Processing" | "Shipped" | "Cancelled") => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    setEditingOrderId(null);
  };

  if (!sessionChecked) {
    return null;
  }

  const statuses = ["All Status", "Processing", "Shipped", "Delivered", "Cancelled"];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "All Status" || order.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

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
            <a href="/admin/orders" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium bg-gray-100 transition"><ShoppingCartIcon className="h-5 w-5" />Orders</a>
            <a href="/admin/products" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition"><CubeIcon className="h-5 w-5" />Products</a>
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
                <a href="/admin/orders" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium bg-gray-100 transition" onClick={() => setMobileMenuOpen(false)}><ShoppingCartIcon className="h-5 w-5" />Orders</a>
                <a href="/admin/products" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 font-medium transition" onClick={() => setMobileMenuOpen(false)}><CubeIcon className="h-5 w-5" />Products</a>
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
          <div className="bg-white">
            <div className="px-8 py-8 flex justify-between items-start">
              <div>
                  <h1 className="text-4xl font-bold text-gray-900">Orders</h1>
                  <p className="text-gray-500 mt-1">Manage and track all customer orders.</p>
                </div>
                <button className="flex items-center bg-blue-500 text-white gap-2 px-4 py-2 hover:bg-blue-600 rounded-lg transition">
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span>Export</span>
                </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white px-8 text-gray-600">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search orders..."
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
          <div className="m-8 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full bg-white">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Order</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Items</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Payment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{order.customer}</div>
                      <div className="text-gray-500">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{order.items}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.amount}</td>
                    <td className="px-6 py-4 text-sm">
                      {editingOrderId === order.id ? (
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(
                              order.id,
                              e.target.value as "Delivered" | "Processing" | "Shipped" | "Cancelled"
                            )
                          }
                          className="px-2 py-1 border text-gray-800 border-gray-300 rounded-md text-sm"
                        >
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-3 py-1 rounded-full font-medium ${statusColors[order.status].bg} ${statusColors[order.status].text}`}
                        >
                          {order.status}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-sm font-medium ${paymentColors[order.payment]}`}>
                      {order.payment}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.date}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => router.push(`/admin/messages?email=${encodeURIComponent(order.email)}&name=${encodeURIComponent(order.customer)}`)}
                          className="text-gray-500 hover:text-gray-700 transition"
                          aria-label={`Message ${order.customer}`}
                        >
                          <EnvelopeIcon className="h-5 w-5" />
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === order.id ? null : order.id)}
                            className="text-gray-500 hover:text-gray-700 transition"
                            aria-label="More actions"
                          >
                            <EllipsisVerticalIcon className="h-5 w-5" />
                          </button>

                          {openMenuId === order.id && (
                            <div className="absolute z-20 mt-2 right-0 w-44 bg-white border border-gray-300 rounded-lg shadow-lg">
                              <button
                                onClick={() => {
                                  setEditingOrderId(order.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 transition text-gray-900"
                              >
                                Update status
                              </button>
                              <button
                                onClick={() => {
                                  router.push(`/admin/orders/${encodeURIComponent(order.id)}`);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 transition text-gray-900"
                              >
                                View order details
                              </button>
                              {/* message customer removed */}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="m-8 rounded-lg shadow-sm p-8 text-center text-gray-500 bg-white">
              No orders found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
