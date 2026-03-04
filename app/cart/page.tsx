"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCartItems, updateCartItemQuantity, removeFromCart, clearCart } from "@/lib/supabaseService";
import Navbar from "../components/Navbar";
import Footer from "../components/FooterWrapper";
import { MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: {
    name?: string;
    price?: string;
    image_url?: string;
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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
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

  // Load cart from Supabase on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUser(data.session.user);
        const meta = data.session.user.user_metadata || {};
        setShippingInfo((prev) => ({
          ...prev,
          fullName: meta.full_name || "",
          email: data.session.user.email || "",
          phone: meta.phone || "",
          address: meta.address?.street || "",
          city: meta.address?.city || "",
          postCode: meta.address?.postCode || "",
          country: meta.address?.country || prev.country,
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

        // Load cart from Supabase
        const items = await getCartItems(data.session.user.email || "");
        setCartItems(items);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Calculate shipping fee when country/region changes
  useEffect(() => {
    if (!shippingInfo.country) return;

    const calcShipping = async () => {
      setCalculating(true);
      setError("");
      try {
        const params = new URLSearchParams({
          country: shippingInfo.country,
        });
        if (shippingInfo.region) {
          params.append("region", shippingInfo.region);
        }

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
  }, [shippingInfo.country, shippingInfo.region]);

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user?.email) return;

    if (quantity <= 0) {
      removeItem(productId);
    } else {
      await updateCartItemQuantity(user.email, productId, quantity);
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
      // Create order via API
      const orderData = {
        customer_name: shippingInfo.fullName,
        customer_email: shippingInfo.email,
        customer_phone: shippingInfo.phone,
        items: cartItems.map((item) => ({
          productId: item.product_id,
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
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

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
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                    >
                      {item.product?.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product?.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.product?.name || "Unknown Product"}</h3>
                        <p className="text-gray-600">£{price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2 border border-gray-300 rounded">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100"
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
                    onChange={(e) =>
                      setShippingInfo({
                        ...shippingInfo,
                        country: e.target.value,
                        region: "",
                      })
                    }
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
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, region: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  )}

                  {shippingInfo.country === "GH" && (
                    <input
                      type="text"
                      placeholder="Region / State"
                      value={shippingInfo.region}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, region: e.target.value })
                      }
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
                disabled={submitting || calculating || cartItems.length === 0}
                className="w-full px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? "Processing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

