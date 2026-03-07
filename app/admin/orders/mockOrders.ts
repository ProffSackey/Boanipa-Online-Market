interface Order {
  id: string;
  customer: string;
  email: string;
  phone: string;
  items: number;
  amount: string;
  status: "Delivered" | "Processing" | "Shipped" | "Cancelled";
  payment: "Paid" | "Refunded" | "Pending";
  date: string;
  itemsList?: { name: string; qty: number; price: string }[];
  shippingAddress?: string;
  subtotal?: string;
  shippingCost?: string;
  tax?: string;
  total?: string;
  itemsDetail?: Array<{ productId: string; quantity: number; price: number; name?: string; image?: string }>;
}

const mockOrders: Order[] = [];

export default mockOrders;
export type { Order };
