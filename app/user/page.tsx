"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { ArrowLeftIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, CogIcon, Bars3Icon, UserCircleIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";

interface Order {
  id: string;
  date: string;
  amount: string;
  status: "Delivered" | "Processing" | "Shipped" | "Cancelled";
  items: number;
}

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  country: string;
  address: string;
  joinedDate: string;
  orders: Order[];
}

// used for the editable account settings form
interface ProfileForm {
  fullName: string;
  phone: string;
  country: string;
  address: string;
  city: string;
  postCode: string;
  region: string;
}

export default function UserPage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    fullName: "",
    phone: "",
    country: "GB",
    address: "",
    city: "",
    postCode: "",
    region: "",
  });
  const router = useRouter();

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!data.session) {
          router.replace('/login');
        } else {
          setUser(data.session.user);
          // populate both the read-only profile shown on the page and the editable form
          const metadata = data.session.user.user_metadata || {};

          // fill profile form fields from metadata (if any)
          setProfileForm((prev) => ({
            fullName: metadata.full_name || prev.fullName,
            phone: metadata.phone || prev.phone,
            country: metadata.address?.country || prev.country,
            address: metadata.address?.street || prev.address,
            city: metadata.address?.city || prev.city,
            postCode: metadata.address?.postCode || prev.postCode,
            region: metadata.address?.region || prev.region,
          }));

          // build a simplified view model for the profile section
          const builtProfile: UserProfile = {
            id: data.session.user.id,
            email: data.session.user.email || '',
            fullName: metadata.full_name || data.session.user.email || '',
            phone: metadata.phone || '',
            country: metadata.address?.country || '',
            address: metadata.address?.street || '',
            joinedDate: data.session.user.created_at
              ? new Date(data.session.user.created_at).toLocaleDateString()
              : '',
            orders: [],
          };

          // attempt to fetch recent orders for display
          fetch(`/api/customer-orders?email=${encodeURIComponent(builtProfile.email)}`)
            .then((res) => res.ok ? res.json() : Promise.reject())
            .then((orders: any[]) => {
              builtProfile.orders = orders.map((o) => ({
                id: o.id,
                date: o.created_at || '',
                amount: o.total_amount || '',
                status: o.status || 'Processing',
                items: Array.isArray(o.items) ? o.items.length : 0,
              }));
            })
            .catch((_) => {
              // ignore failure, profile will show empty orders
            })
            .finally(() => {
              setUserProfile(builtProfile);
              setLoading(false);
            });
        }
      })
      .catch((err) => {
        console.error(err);
        router.replace('/login');
      });
  }, [router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      router.push('/login');
    }
  };

  if (loading || !user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-gray-600 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  const saveProfile = async () => {
    try {
      setLoading(true);
      const updates: any = {
        data: {
          full_name: profileForm.fullName,
          phone: profileForm.phone,
          address: {
            street: profileForm.address,
            city: profileForm.city,
            postCode: profileForm.postCode,
            country: profileForm.country,
            region: profileForm.region,
          },
        },
      };
      const { error } = await supabase.auth.updateUser(updates);
      if (error) {
        console.error('Failed to update profile:', error);
        alert('Unable to save profile');
      } else {
        // refresh page state so that userProfile and form stay in sync
        const session = await supabase.auth.getSession();
        if (session.data.session) {
          setUser(session.data.session.user);
        }
        alert('Profile saved');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Desktop Sidebar */}
      <aside className="w-64 text-gray-800 bg-white border-r border-gray-200 p-4 hidden md:flex md:flex-col">
        <h2 className="text-lg font-semibold mb-6 text-gray-900">My Account</h2>
        <nav className="space-y-3 text-gray-700 text-base flex-1">
          <button
            onClick={() => {
              router.push('/user');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left block px-3 py-2 rounded hover:bg-gray-100 font-medium transition flex items-center gap-3"
          >
            <UserCircleIcon className="h-5 w-5" />
        {/* Shipping/Profile editing form */}
        <div className="bg-white shadow rounded-lg p-8 mb-6" id="settings">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                value={profileForm.fullName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, fullName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={profileForm.country}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    country: e.target.value,
                    region: '',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="GB">United Kingdom</option>
                <option value="US">United States</option>
                <option value="GH">Ghana</option>
              </select>
              {(profileForm.country === 'GB' || profileForm.country === 'GH') && (
                <input
                  type="text"
                  placeholder="Region/State"
                  value={profileForm.region}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      region: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              )}
              {profileForm.country === 'US' && (
                <select
                  value={profileForm.region}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, region: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select State</option>
                  <option value="CA">California</option>
                  <option value="CO">Colorado</option>
                  <option value="GA">Georgia</option>
                </select>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Street Address"
                value={profileForm.address}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="text"
                placeholder="City"
                value={profileForm.city}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, city: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <input
              type="text"
              placeholder="Post Code"
              value={profileForm.postCode}
              onChange={(e) =>
                setProfileForm({ ...profileForm, postCode: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={saveProfile}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Save Settings
            </button>
          </div>
        </div>
            My Profile
          </button>
          <button
            onClick={() => {
              router.push('/orders');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left block px-3 py-2 rounded hover:bg-gray-100 font-medium transition flex items-center gap-3"
          >
            <ShoppingBagIcon className="h-5 w-5" />
            My Orders
          </button>
          <button
            onClick={() => {
              document.getElementById('settings')?.scrollIntoView({ behavior: 'smooth' });
              setMobileMenuOpen(false);
            }}
            className="w-full text-left block px-3 py-2 rounded hover:bg-gray-100 font-medium transition flex items-center gap-3"
          >
            <CogIcon className="h-5 w-5" />
            Settings
          </button>
        </nav>
        <div className="border-t pt-4">
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 rounded hover:bg-red-50 font-medium transition text-red-600"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col shadow-lg">
            <h2 className="text-lg font-semibold mb-6 text-gray-900">My Account</h2>
            <nav className="space-y-3 text-gray-700 text-base flex-1">
              <button
                onClick={() => {
                  router.push('/user');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left block px-3 py-2 rounded hover:bg-gray-100 font-medium transition flex items-center gap-3"
              >
                <UserCircleIcon className="h-5 w-5" />
                My Profile
              </button>
              <button
                onClick={() => {
                  router.push('/orders');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left block px-3 py-2 rounded hover:bg-gray-100 font-medium transition flex items-center gap-3"
              >
                <ShoppingBagIcon className="h-5 w-5" />
                My Orders
              </button>
              <button
                onClick={() => {
                  document.getElementById('settings')?.scrollIntoView({ behavior: 'smooth' });
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left block px-3 py-2 rounded hover:bg-gray-100 font-medium transition flex items-center gap-3"
              >
                <CogIcon className="h-5 w-5" />
                Settings
              </button>
            </nav>
            <div className="border-t pt-4">
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 rounded hover:bg-red-50 font-medium transition text-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Menu Toggle */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded transition"
          >
            <Bars3Icon className="h-6 w-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">My Account</h1>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition mb-6 font-medium"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back to Shopping
            </button>

            {/* Profile Header */}
            <div className="bg-white shadow rounded-lg p-8 mb-6">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
                  {getInitials(userProfile.fullName)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{userProfile.fullName}</h1>
                    <span className="px-4 py-2 rounded-full font-semibold text-sm bg-green-100 text-green-600">
                      Active Member
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">Member since {userProfile.joinedDate}</p>

                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => router.push('/orders')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      View All Orders
                    </button>
                    <button
                      onClick={() => document.getElementById('settings')?.scrollIntoView({ behavior: 'smooth' })}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                    >
                      <CogIcon className="h-5 w-5" />
                      Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white shadow rounded-lg p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                    <p className="text-gray-900">{userProfile.email}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <PhoneIcon className="h-5 w-5 text-gray-500" />
                    <p className="text-gray-900">{userProfile.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white shadow rounded-lg p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Address</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <MapPinIcon className="h-5 w-5 text-gray-500" />
                    <p className="text-gray-900">{userProfile.country}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900">{userProfile.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div className="bg-white shadow rounded-lg p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                  {userProfile.orders.length} orders
                </span>
              </div>

              {userProfile.orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Order ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Items</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userProfile.orders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{order.date}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{order.items}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.amount}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === "Delivered" ? "bg-blue-100 text-blue-600" :
                              order.status === "Processing" ? "bg-yellow-100 text-yellow-600" :
                              order.status === "Shipped" ? "bg-purple-100 text-purple-600" :
                              "bg-red-100 text-red-600"
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No orders yet. Start shopping now!</p>
                </div>
              )}
            </div>

            {/* Account Settings */}
            <div className="bg-white shadow rounded-lg p-8" id="settings">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition font-medium text-gray-900">
                  Edit Profile
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition font-medium text-gray-900">
                  Change Password
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition font-medium text-gray-900">
                  Notification Preferences
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition font-medium text-red-600"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
