"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCartItems, updateCartItemQuantity, removeFromCart, clearCart, addToCart } from "@/lib/supabaseService";
import { MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { getGuestCart, clearGuestCart } from "@/lib/cartUtils";
import { useUserAuth } from "../../lib/useUserAuth";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: {
    name?: string;
    price?: string;
    image_url?: string;
    stock_quantity?: number;
  };
}

interface ShippingInfo {
  country: string;
  region: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postCode: string;
}

interface ShippingRate {
  shippingFee: number;
  estimatedDeliveryMin: number;
  estimatedDeliveryMax: number;
}

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUserAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    country: "GB",
    region: "",
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postCode: "",
  });
  const [shippingRate, setShippingRate] = useState<ShippingRate | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userInitiated, setUserInitiated] = useState(false); // Track if user has changed country/region

  // Load cart from Supabase or localStorage on mount
  useEffect(() => {
    if (!user) return;

    const loadCart = async () => {
      const meta = user.user_metadata || {};

      // Normalize country to ISO codes where possible
      const rawCountry = (meta.address?.country || shippingInfo.country || "").toString();
      const countryKey = rawCountry.trim().toUpperCase();
      const countryMap: Record<string, string> = {
        'GHANA': 'GH', 'GH': 'GH',
        'UNITED KINGDOM': 'GB', 'UK': 'GB', 'GB': 'GB',
        'UNITED STATES': 'US', 'USA': 'US', 'US': 'US'
      };
      const normalizedCountry = countryMap[countryKey] || rawCountry;

      setShippingInfo((prev) => ({
        ...prev,
        fullName: meta.full_name || "",
        email: user.email || "",
        phone: meta.phone || "",
        address: meta.address?.street || "",
        city: meta.address?.city || "",
        postCode: meta.address?.postCode || "",
        country: normalizedCountry,
        region: meta.address?.region || prev.region,
      }));

      // gently remind user to complete profile if key fields missing
      if (
        !meta.full_name ||
        !meta.phone ||
        !meta.address?.street ||
        !meta.address?.city ||
        !meta.address?.postCode
      ) {
        setError(
          "Your account is missing some shipping details – please update your profile before placing an order."
        );
      }

      // Load cart from Supabase (safe: catch and log details)
      let items: CartItem[] = [];
      try {
        const userEmail = user.email || "";
        // console.log('Fetching cart for user:', userEmail); // Removed for security
        items = await getCartItems(userEmail);
      } catch (err) {
        console.error('Failed to get cart items (detailed):', err);
        items = [];
      }

      // Also check for guest cart and merge if exists
      const guestCart = getGuestCart();
      if (guestCart.length > 0) {
        // Add guest cart items to user cart
        for (const guestItem of guestCart) {
          // Use a high default stock value since actual stock will be validated at checkout
          await addToCart(user.email || "", guestItem.productId, guestItem.quantity, 999);
        }
        // Clear guest cart after merging
        clearGuestCart();
        // Reload items
        try {
          const updatedItems = await getCartItems(user.email || "");
          setCartItems(updatedItems);
        } catch (err) {
          console.error('Failed to reload cart items after merge:', err);
          setCartItems([]);
        }
      } else {
        setCartItems(items);
      }

      setLoading(false);
    };

    loadCart();
  }, [user]);

  // Subscribe to app-level cart change events so this page updates in real-time
  useEffect(() => {
    const handler = async (ev: any) => {
      try {
        const email = ev?.detail?.email || (user && user.email) || null;
        if (!email) return;
        const items = await getCartItems(email);
        setCartItems(items);
      } catch (e) {
        console.error('Failed to refresh cart items on userCartChange event:', e);
      }
    };

    window.addEventListener('userCartChange', handler as EventListener);
    return () => window.removeEventListener('userCartChange', handler as EventListener);
  }, [user]);

  // Calculate shipping fee when country/region changes (only if user initiated)
  useEffect(() => {
    if (!shippingInfo.country || !userInitiated) return;

    const calcShipping = async () => {
      setCalculating(true);
      setError("");
      try {
        const location = shippingInfo.region || shippingInfo.country;
        const params = new URLSearchParams({
          location: location,
        });

        const res = await fetch(`/api/shipping-rates?${params}`);
        if (!res.ok) {
          const errorData = await res.json();
          setError(errorData.error || "Shipping not available for this location");
          setShippingRate(null);
        } else {
          const data = await res.json();
          setShippingRate({
            shippingFee: data.shippingFee,
            estimatedDeliveryMin: data.estimatedDeliveryMin,
            estimatedDeliveryMax: data.estimatedDeliveryMax,
          });
        }
      } catch (err) {
        console.error("Error calculating shipping:", err);
        setError("Failed to calculate shipping fee");
        setShippingRate(null);
      } finally {
        setCalculating(false);
      }
    };

    calcShipping();
  }, [shippingInfo.country, shippingInfo.region, userInitiated]);

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user?.email) return;

    if (quantity <= 0) {
      removeItem(productId);
    } else {
      const cartItem = cartItems.find((item) => item.product_id === productId);
      const stock = cartItem?.product?.stock_quantity || 0;
      await updateCartItemQuantity(user.email, productId, quantity, stock);
      const updated = cartItems.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item
      );
      setCartItems(updated);
    }
  };

  const removeItem = async (productId: string) => {
    if (!user?.email) return;

    await removeFromCart(user.email, productId);
    setCartItems(cartItems.filter((item) => item.product_id !== productId));
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.product?.price?.replace("£", "") || "0");
    return sum + price * item.quantity;
  }, 0);

  const shippingFee = shippingRate?.shippingFee ?? 0;
  const total = subtotal + shippingFee;

  const handleCheckout = async () => {
    // Validate shipping info
    if (
      !shippingInfo.fullName ||
      !shippingInfo.email ||
      !shippingInfo.phone ||
      !shippingInfo.address ||
      !shippingInfo.city ||
      !shippingInfo.postCode
    ) {
      setError(
        "Please complete your profile/shipping information before checking out or update your account settings."
      );
      return;
    }

    if (!shippingRate) {
      setError("Please select a valid shipping location");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Update user metadata with shipping address for future use
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: shippingInfo.fullName,
          phone: shippingInfo.phone,
          address: {
            street: shippingInfo.address,
            city: shippingInfo.city,
            postCode: shippingInfo.postCode,
            country: shippingInfo.country,
            region: shippingInfo.region,
          },
        },
      });

      if (updateError) {
        console.error('Failed to update user metadata:', updateError);
        // Don't fail the order for this, just log
      }

      // Create order via API
      const orderData = {
        customer_name: shippingInfo.fullName,
        customer_email: shippingInfo.email,
        customer_phone: shippingInfo.phone,
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: parseFloat(item.product?.price?.replace("£", "") || "0"),
        })),
        total_amount: total,
        shipping_address: {
          street: shippingInfo.address,
          city: shippingInfo.city,
          postcode: shippingInfo.postCode,
          country: shippingInfo.country,
          region: shippingInfo.region,
        },
        shipping_fee: shippingFee,
        status: "pending",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      // Clear cart
      if (user?.email) {
        await clearCart(user.email);
      }
      setCartItems([]);

      // Show success and redirect
      alert("Order created successfully!");
      router.push("/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view your cart</p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 flex flex-col bg-white">

      {/* Login Prompt for Guest Users */}
      {!loading && !user && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto w-full px-4 py-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-1">Ready to checkout?</h2>
              <p className="text-blue-700">Log in or create an account to complete your purchase</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Log In
              </button>
              <button
                onClick={() => router.push('/auth/check-user')}
                className="px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {cartItems.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-4">Your cart is empty</p>
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const price = parseFloat(item.product?.price?.replace("£", "") || "0");
                  const inStock = item.product?.stock_quantity != null ? Number(item.product.stock_quantity) : null;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                        {item.product?.image_url ? (
                          <img src={item.product.image_url} alt={item.product?.name || 'Product'} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-gray-500">No image</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {item.product?.name || `Product ID: ${item.product_id}`}
                        </h3>
                        <p className="text-gray-600">£{price.toFixed(2)}</p>
                        {inStock != null && (
                          <p className="text-sm text-gray-500">In stock: {inStock}</p>
                        )}
                        {!item.product?.name && (
                          <p className="text-red-500 text-sm">⚠️ Product data not found</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 border border-gray-300 rounded">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100"
                          aria-label="Decrease quantity"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100"
                          aria-label="Increase quantity"
                          disabled={inStock != null && item.quantity >= inStock}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="font-semibold text-gray-900 w-20 text-right">
                        £{(price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shipping & Checkout */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              {/* Order Summary */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping:</span>
                    <span>
                      {calculating ? (
                        <span className="text-sm text-gray-500">Calculating...</span>
                      ) : shippingRate ? (
                        `£${shippingRate.shippingFee.toFixed(2)}`
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                  {shippingRate && (
                    <div className="text-sm text-gray-500">
                      Estimated delivery: {shippingRate.estimatedDeliveryMin}-{shippingRate.estimatedDeliveryMax} days
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                    <span>Total:</span>
                    <span>£{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Shipping Address</h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={shippingInfo.fullName}
                    onChange={(e) =>
                      setShippingInfo({ ...shippingInfo, fullName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={shippingInfo.email}
                    onChange={(e) =>
                      setShippingInfo({ ...shippingInfo, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={shippingInfo.phone}
                    onChange={(e) =>
                      setShippingInfo({ ...shippingInfo, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <select
                    value={shippingInfo.country}
                    onChange={(e) => {
                      setShippingInfo({
                        ...shippingInfo,
                        country: e.target.value,
                        region: "",
                      });
                      setUserInitiated(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="GB">United Kingdom</option>
                    <option value="US">United States</option>
                    <option value="GH">Ghana</option>
                  </select>

                  {shippingInfo.country === "GB" && (
                    <input
                      type="text"
                      placeholder="Region Code (e.g., SW, NW)"
                      value={shippingInfo.region}
                      onChange={(e) => {
                        setShippingInfo({ ...shippingInfo, region: e.target.value.toUpperCase() });
                        setUserInitiated(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  )}

                  {shippingInfo.country === "GH" && (
                    <input
                      type="text"
                      placeholder="Region / State"
                      value={shippingInfo.region}
                      onChange={(e) => {
                        setShippingInfo({ ...shippingInfo, region: e.target.value });
                        setUserInitiated(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  )}

                  {shippingInfo.country === "US" && (
                    <select
                      value={shippingInfo.region}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, region: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select State</option>
                      <option value="CA">California</option>
                      <option value="CO">Colorado</option>
                      <option value="GA">Georgia</option>
                    </select>
                  )}

                  <input
                    type="text"
                    placeholder="Address *"
                    value={shippingInfo.address}
                    onChange={(e) =>
                      setShippingInfo({ ...shippingInfo, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="City *"
                    value={shippingInfo.city}
                    onChange={(e) =>
                      setShippingInfo({ ...shippingInfo, city: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Post Code"
                    value={shippingInfo.postCode}
                    onChange={(e) =>
                      setShippingInfo({ ...shippingInfo, postCode: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={submitting || calculating || cartItems.length === 0 || !user}
                className="w-full px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {!user ? "Log in to Checkout" : submitting ? "Processing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
}

