"use client";

import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

import { useEffect, useState } from 'react';

export default function SalesByCategory() {
  const [categories, setCategories] = useState<{ name: string; count: number; color?: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/products');
        if (!res.ok) return;
        const products = await res.json();
        if (!Array.isArray(products)) return;

        const map = new Map<string, number>();
        for (const p of products) {
          const cat = p.category?.name || p.category || p.category_name || 'Uncategorized';
          map.set(cat, (map.get(cat) || 0) + 1);
        }

        const palette = ['#3b82f6','#f59e0b','#10b981','#a855f7','#ef4444','#06b6d4','#f97316'];
        const arr = Array.from(map.entries())
          .map(([name, count], i) => ({ name, count, color: palette[i % palette.length] }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        setCategories(arr);
      } catch (err) {
        console.warn('SalesByCategory: unable to load products', err);
      }
    })();
  }, []);

  const labels = categories.map(c => c.name);
  const counts = categories.map(c => c.count);
  const colors = categories.map(c => c.color || '#3b82f6');

  const data = {
    labels,
    datasets: [
      {
        data: counts,
        backgroundColor: colors,
        hoverOffset: 4,
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context:any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = counts.reduce((s:number, v:number) => s + v, 0) || 1;
            const pct = Math.round((value / total) * 100);
            return `${label}: ${pct}%`;
          }
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-8">Sales by Category</h2>
      <div className="relative w-full h-64">
        <Doughnut data={data} options={options} />
      </div>
      <div className="w-full space-y-3 mt-6">
        {categories.length === 0 ? (
          <div className="text-gray-500">No category data</div>
        ) : (
          categories.map(cat => (
            <div key={cat.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-gray-700 font-medium text-sm">{cat.name}</span>
              </div>
              <span className="text-gray-900 font-semibold text-sm">{Math.round((cat.count / (counts.reduce((s,n)=>s+n,0)||1)) * 100)}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
