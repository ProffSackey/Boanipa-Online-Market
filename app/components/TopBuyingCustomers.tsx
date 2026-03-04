"use client";

interface TopBuyingCustomersProps {
  timePeriod: string;
}

export default function TopBuyingCustomers({ timePeriod }: TopBuyingCustomersProps) {
  const customers: Array<{ id: number; name: string; spent: string; orders: number }> = [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Top Buying Customers</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Customer Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Total Spent</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Orders</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{customer.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{customer.spent}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{customer.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
