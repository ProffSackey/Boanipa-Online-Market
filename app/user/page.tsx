"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { ArrowLeftIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, CogIcon, Bars3Icon, UserCircleIcon, ShoppingBagIcon, StarIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

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
  // which sub-section of the settings panel is currently visible
  const [settingsSection, setSettingsSection] = useState<
    "menu" | "editProfile" | "payment" | "security" | "shipping"
  >("menu");

  // form state used for editing profile information
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
  const pathname = usePathname();

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

          console.log('=== USER SESSION INFO ===');
          console.log('User Email from session:', builtProfile.email);
          console.log('User ID:', builtProfile.id);
          console.log('Full Name:', builtProfile.fullName);

          // attempt to fetch recent orders for display
          console.log('Fetching orders for email:', builtProfile.email);
          fetch(`/api/customer-orders?email=${encodeURIComponent(builtProfile.email)}`)
            .then((res) => {
              console.log('Orders API response status:', res.status);
              if (!res.ok) {
                console.error('Failed to fetch orders:', res.status);
                return [];
              }
              return res.json();
            })
            .then((ordersData: any[]) => {
              console.log('Orders API response data:', ordersData);
              if (Array.isArray(ordersData) && ordersData.length > 0) {
                console.log(`Mapping ${ordersData.length} orders`);
                builtProfile.orders = ordersData.map((o) => ({
                  id: o.order_number || o.id,
                  date: o.created_at ? new Date(o.created_at).toLocaleDateString() : '',
                  amount: `£${(o.total_amount || 0).toFixed(2)}`,
                  status: (o.status || 'processing').charAt(0).toUpperCase() + (o.status || 'processing').slice(1).toLowerCase() as any,
                  items: Array.isArray(o.items) ? o.items.length : 0,
                }));
                console.log('Mapped orders:', builtProfile.orders);
              } else {
                console.log('No orders returned or ordersData is not an array');
              }
            })
            .catch((err) => {
              console.error('Error fetching orders:', err);
              // ignore failure, profile will show empty orders
            })
            .finally(() => {
              console.log('Setting profile with orders:', builtProfile.orders);
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
  // At this point we know userProfile is defined; make a non-nullable reference for cleaner JSX
  const profile = userProfile;

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
        // reflect updated information in UI
        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                fullName: profileForm.fullName,
                phone: profileForm.phone,
                country: profileForm.country,
                address: profileForm.address,
              }
            : prev
        );
        setSettingsSection('menu');
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
        {/* user avatar & name */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
            {getInitials(profile.fullName)}
          </div>
          <div className="text-gray-900 font-medium truncate">{userProfile.fullName}</div>
        </div>

        <nav className="space-y-3 text-gray-700 text-base flex-1">
          <button
            onClick={() => {
              router.push('/user');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left block px-3 py-2 rounded hover:bg-gray-100 font-medium transition flex items-center gap-3 ${pathname === '/user' ? 'bg-gray-100' : ''}`}
          >
            <UserCircleIcon className="h-5 w-5" />
            My Profile
          </button>
          <button
            onClick={() => {
              router.push('/orders');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left block px-3 py-2 rounded hover:bg-gray-100 font-medium transition flex items-center gap-3 ${pathname === '/orders' ? 'bg-gray-100' : ''}`}
          >
            <ShoppingBagIcon className="h-5 w-5" />
            My Orders
          </button>
          <button
            onClick={() => {
              router.push('/messages');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left block px-3 py-2 rounded hover:bg-gray-100 font-medium transition flex items-center gap-3 ${pathname === '/messages' ? 'bg-gray-100' : ''}`}
          >
            <EnvelopeIcon className="h-5 w-5" />
            Messages
          </button>
          <button
            onClick={() => {
              router.push('/reviews');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left block px-3 py-2 rounded hover:bg-gray-100 font-medium transition flex items-center gap-3 ${pathname === '/reviews' ? 'bg-gray-100' : ''}`}
          >
            <StarIcon className="h-5 w-5" />
            Ratings & Reviews
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
            {/* user info */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                {getInitials(userProfile.fullName)}
              </div>
              <div className="text-gray-900 font-medium truncate">{userProfile.fullName}</div>
            </div>
            <nav className="space-y-3 text-gray-700 text-base flex-1">
              <button
                onClick={() => {
                  router.push('/user');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left block px-3 py-2 rounded hover:bg-gray-100 font-medium transition flex items-center gap-3 ${pathname === '/user' ? 'bg-gray-100' : ''}`}
              >
                <UserCircleIcon className="h-5 w-5" />
                My Profile
              </button>
              <button
                onClick={() => {
                  router.push('/orders');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left block px-3 py-2 rounded hover:bg-gray-100 font-medium transition flex items-center gap-3 ${pathname === '/orders' ? 'bg-gray-100' : ''}`}
              >
                <ShoppingBagIcon className="h-5 w-5" />
                My Orders
              </button>
              <button
                onClick={() => {
                  router.push('/messages');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left block px-3 py-2 rounded hover:bg-gray-100 font-medium transition flex items-center gap-3 ${pathname === '/messages' ? 'bg-gray-100' : ''}`}
              >
                <EnvelopeIcon className="h-5 w-5" />
                Messages
              </button>
              <button
                onClick={() => {
                  router.push('/reviews');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left block px-3 py-2 rounded hover:bg-gray-100 font-medium transition flex items-center gap-3 ${pathname === '/reviews' ? 'bg-gray-100' : ''}`}
              >
                <StarIcon className="h-5 w-5" />
                Ratings & Reviews
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
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm rounded-xl p-8 mb-8 border border-blue-200">
              <div className="flex items-start gap-6">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-4xl flex-shrink-0 shadow-lg">
                  {getInitials(userProfile.fullName)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h1 className="text-4xl font-bold text-gray-900">{profile.fullName}</h1>
                      <p className="text-blue-600 font-medium mt-1">Member since {profile.joinedDate}</p>
                    </div>
                    <span className="px-4 py-2 rounded-full font-semibold text-sm bg-green-100 text-green-700 border border-green-300">
                      ✓ Active Member
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white shadow-sm rounded-xl p-8 mb-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition">
                  <label className="block text-xs uppercase font-semibold text-gray-600 mb-3 tracking-wider">Email Address</label>
                  <div className="flex items-center gap-3">
                    <EnvelopeIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <p className="text-gray-900 font-medium">{profile.email}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition">
                  <label className="block text-xs uppercase font-semibold text-gray-600 mb-3 tracking-wider">Phone Number</label>
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <p className="text-gray-900 font-medium">{profile.phone || '—'}</p>
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
                    <p className="text-gray-900">{profile.country}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900">{profile.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div className="bg-white shadow rounded-lg p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                  {profile.orders.length} orders
                </span>
              </div>
              {/* Debug info - remove this later */}
              <div className="mb-4 p-3 bg-gray-100 rounded text-sm text-gray-700">
                <p>Account Email: <strong>{profile.email}</strong></p>
              </div>
              {profile.orders.length > 0 ? (
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
                      {profile.orders.map((order) => (
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
              {settingsSection === 'menu' && (
                <div className="space-y-3">
                  <button
                    onClick={() => setSettingsSection('editProfile')}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition font-medium text-gray-900"
                  >
                    Personal Information
                  </button>
                  <button
                    onClick={() => setSettingsSection('payment')}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition font-medium text-gray-900"
                  >
                    Payment Settings
                  </button>
                  <button
                    onClick={() => setSettingsSection('security')}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition font-medium text-gray-900"
                  >
                    Security Settings
                  </button>
                  <button
                    onClick={() => setSettingsSection('shipping')}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition font-medium text-gray-900"
                  >
                    Shipping / Delivery Info
                  </button>
                </div>
              )}

              {settingsSection === 'editProfile' && (
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
              )}

              {settingsSection === 'payment' && (
                <p className="text-gray-600">Payment settings coming soon.</p>
              )}
              {settingsSection === 'security' && (
                <p className="text-gray-600">Security settings coming soon.</p>
              )}
              {settingsSection === 'shipping' && (
                <p className="text-gray-600">Shipping/delivery information coming soon.</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
