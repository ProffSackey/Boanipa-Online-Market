"use client";

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

import { useEffect, useState } from 'react';

export default function RevenueChart() {
  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [monthlyData, setMonthlyData] = useState<number[]>(new Array(12).fill(0));
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/orders');
        if (!res.ok) return;
        const orders = await res.json();
        if (!Array.isArray(orders)) return;

        const months = new Array(12).fill(0);
        for (const order of orders) {
          const dateStr = order.created_at || order.date || order.ordered_at || order.order_date;
          const d = dateStr ? new Date(dateStr) : null;
          if (!d || d.getFullYear() !== currentYear) continue;

          const m = d.getMonth();
          const amountRaw = order.total_amount ?? order.amount ?? order.total ?? order.grand_total ?? 0;
          const amount = parseFloat(String(amountRaw).replace(/[^0-9.-]+/g, '')) || 0;
          if (!isNaN(m)) months[m] += amount;
        }
        setMonthlyData(months.map((v) => Math.round(v)));
      } catch (err) {
        console.warn('RevenueChart: unable to load orders', err);
      }
    })();
  }, []);

  const data = {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data: monthlyData,
        fill: true,
        backgroundColor: (context:any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(59,130,246,0.25)');
          gradient.addColorStop(1, 'rgba(59,130,246,0.02)');
          return gradient;
        },
        borderColor: '#3b82f6',
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 12, weight: 500 as any } },
      },
      y: {
        grid: { color: '#e5e7eb' },
        ticks: {
          color: '#6b7280',
          callback: (value:any) => `£${value.toLocaleString()}`,
          font: { size: 12, weight: 500 as any },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Revenue Overview</h2>
      <div className="w-full h-80">
        <Line data={data} options={options as any} />
      </div>
    </div>
  );
}
