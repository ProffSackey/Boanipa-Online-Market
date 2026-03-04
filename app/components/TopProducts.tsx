"use client";

interface TopProductsProps {
  timePeriod?: string;
}

export default function TopProducts({ timePeriod }: TopProductsProps) {
  const products: Array<{ name: string; sales: number }> = [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Top Products</h2>
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="flex items-center justify-between pb-3 border-b last:border-b-0">
            <div>
              <p className="font-semibold text-gray-900">{product.name}</p>
              <p className="text-sm text-gray-600">{product.sales} units sold</p>
            </div>
            <div className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-sm">
              #{index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
