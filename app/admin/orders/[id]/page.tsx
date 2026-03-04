"use client";

import { useRouter } from "next/navigation";
import mockOrders, { Order } from "../mockOrders";

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

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  // try to find a real order from the mock list
  const found = mockOrders.find((o) => o.id === params.id);

  // hard-coded example order to display when a real one is not available
  const sampleOrder: Order = {
    id: "#ORD-EXAMPLE",
    customer: "Jane Example",
    email: "jane@example.com",
    items: 3,
    amount: "£199.97",
    status: "Processing",
    payment: "Paid",
    date: "Mar 2, 2026",
    itemsList: [
      { name: "Classic Tee — S", qty: 1, price: "£29.99" },
      { name: "Leather Belt", qty: 1, price: "£49.99" },
      { name: "Sneakers", qty: 1, price: "£119.99" },
    ],
    shippingAddress: "123 Example St, London, UK",
    subtotal: "£199.97",
    shippingCost: "£0.00",
    tax: "£0.00",
    total: "£199.97",
  };

  const orderToShow = found ?? sampleOrder;

  return (
    <div className="p-8">
      <button
        onClick={() => router.back()}
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        &larr; Back
      </button>

      <h1 className="text-3xl font-bold mb-6 text-gray-900">Order {orderToShow.id}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4 bg-white p-6 rounded shadow-sm text-gray-900">
          <div>
            <span className="font-semibold">Customer:</span> {orderToShow.customer} ({orderToShow.email})
          </div>
          <div>
            <span className="font-semibold">Date:</span> {orderToShow.date}
          </div>
          <div>
            <span className="font-semibold">Status:</span>{" "}
            <span
              className={`inline-block px-3 py-1 rounded-full font-medium text-xs ${statusColors[orderToShow.status].bg} ${statusColors[orderToShow.status].text}`}
            >
              {orderToShow.status}
            </span>
          </div>

          <hr className="my-4" />

          <div>
            <h2 className="font-semibold mb-2 text-gray-900">Items</h2>
            <div className="space-y-2">
              {(orderToShow.itemsList || []).map((it: { name: string; qty: number; price: string }, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{it.name}</div>
                    <div className="text-sm text-gray-600">Quantity: {it.qty}</div>
                  </div>
                  <div className="font-medium text-gray-900">{it.price}</div>
                </div>
              ))}
            </div>
          </div>

          <hr className="my-4" />

          <div>
            <h2 className="font-semibold mb-2">Shipping</h2>
            <div className="text-gray-700">{orderToShow.shippingAddress}</div>
          </div>
        </div>

        <aside className="bg-white p-6 rounded shadow-sm text-gray-900">
          <h3 className="font-semibold mb-3">Summary</h3>
          <div className="flex justify-between text-gray-700">
            <div>Subtotal</div>
            <div>{orderToShow.subtotal}</div>
          </div>
          <div className="flex justify-between text-gray-700 mt-2">
            <div>Shipping</div>
            <div>{orderToShow.shippingCost}</div>
          </div>
          <div className="flex justify-between text-gray-700 mt-2">
            <div>Tax</div>
            <div>{orderToShow.tax}</div>
          </div>

          <hr className="my-3" />

          <div className="flex justify-between font-semibold text-gray-900">
            <div>Total</div>
            <div>{orderToShow.total}</div>
          </div>

          <div className="mt-4">
            <div className="text-sm text-gray-600">Payment: <span className={paymentColors[orderToShow.payment]}>{orderToShow.payment}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
