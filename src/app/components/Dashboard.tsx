"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardData {
  summary: {
    totalRevenue: number;
    orderCount: number;
    avgOrder: number;
    bigOrders: number;
  };
  byCity: Record<string, { count: number; revenue: number }>;
  byUtm: Record<string, { count: number; revenue: number }>;
  distribution: Array<{ label: string; count: number }>;
  topProducts: Array<{ name: string; count: number; revenue: number }>;
  orders: Array<{
    id: number;
    name: string;
    city: string;
    total: number;
    utm: string;
    status: string;
    date: string;
  }>;
}

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a78bfa",
  "#c4b5fd",
  "#818cf8",
  "#7c3aed",
  "#4f46e5",
  "#4338ca",
];

function fmt(n: number) {
  return n.toLocaleString("ru-RU");
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );

  if (error || !data)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl max-w-md">
          <h2 className="font-bold text-lg mb-2">Error loading data</h2>
          <p>{error || "No data available"}</p>
          <p className="mt-3 text-sm text-red-500">
            Check that Supabase is configured and orders are synced.
          </p>
        </div>
      </div>
    );

  const { summary, byCity, byUtm, distribution, topProducts, orders } = data;

  // City chart
  const cityLabels = Object.keys(byCity);
  const cityData = {
    labels: cityLabels,
    datasets: [
      {
        label: "Orders",
        data: cityLabels.map((c) => byCity[c].count),
        backgroundColor: COLORS.slice(0, cityLabels.length),
        borderWidth: 0,
      },
    ],
  };

  // UTM chart
  const utmLabels = Object.keys(byUtm);
  const utmData = {
    labels: utmLabels,
    datasets: [
      {
        label: "Revenue (₸)",
        data: utmLabels.map((u) => byUtm[u].revenue),
        backgroundColor: COLORS.slice(0, utmLabels.length),
        borderRadius: 8,
      },
    ],
  };

  // Distribution chart
  const distData = {
    labels: distribution.map((d) => d.label),
    datasets: [
      {
        label: "Orders",
        data: distribution.map((d) => d.count),
        backgroundColor: "rgba(99,102,241,0.7)",
        borderColor: "#6366f1",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  // Top products chart
  const prodData = {
    labels: topProducts.map((p) =>
      p.name.length > 30 ? p.name.slice(0, 30) + "..." : p.name
    ),
    datasets: [
      {
        label: "Revenue (₸)",
        data: topProducts.map((p) => p.revenue),
        backgroundColor: "rgba(139,92,246,0.7)",
        borderColor: "#8b5cf6",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              GBC Analytics
            </h1>
            <p className="text-gray-500 text-sm">Order Dashboard</p>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString("ru-RU")}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            label="Total Revenue"
            value={`${fmt(summary.totalRevenue)} ₸`}
            sub="All orders"
            color="indigo"
          />
          <KPICard
            label="Orders"
            value={String(summary.orderCount)}
            sub={`Avg: ${fmt(summary.avgOrder)} ₸`}
            color="purple"
          />
          <KPICard
            label="Orders > 50K"
            value={String(summary.bigOrders)}
            sub={`${Math.round((summary.bigOrders / summary.orderCount) * 100)}% of total`}
            color="violet"
          />
          <KPICard
            label="Avg Order"
            value={`${fmt(summary.avgOrder)} ₸`}
            sub="Per order"
            color="fuchsia"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid md:grid-cols-2 gap-6">
          <ChartCard title="Orders by City">
            <Doughnut
              data={cityData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "bottom", labels: { color: "#9ca3af" } },
                },
              }}
            />
          </ChartCard>
          <ChartCard title="Revenue by Source">
            <Bar
              data={utmData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  x: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } },
                  y: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } },
                },
              }}
            />
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid md:grid-cols-2 gap-6">
          <ChartCard title="Order Amount Distribution">
            <Bar
              data={distData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } },
                  y: {
                    ticks: { color: "#9ca3af", stepSize: 1 },
                    grid: { color: "#1f2937" },
                  },
                },
              }}
            />
          </ChartCard>
          <ChartCard title="Top Products by Revenue">
            <Bar
              data={prodData}
              options={{
                indexAxis: "y",
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } },
                  y: {
                    ticks: { color: "#9ca3af", font: { size: 11 } },
                    grid: { display: false },
                  },
                },
              }}
            />
          </ChartCard>
        </div>

        {/* Orders Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="text-left px-6 py-3">#</th>
                  <th className="text-left px-6 py-3">Customer</th>
                  <th className="text-left px-6 py-3">City</th>
                  <th className="text-right px-6 py-3">Amount</th>
                  <th className="text-left px-6 py-3">Source</th>
                  <th className="text-left px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 20).map((o, i) => (
                  <tr
                    key={o.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-6 py-3 font-medium">{o.name}</td>
                    <td className="px-6 py-3 text-gray-400">{o.city}</td>
                    <td
                      className={`px-6 py-3 text-right font-mono ${
                        o.total > 50000 ? "text-amber-400 font-bold" : ""
                      }`}
                    >
                      {fmt(o.total)} ₸
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-300">
                        {o.utm}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-300">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 px-6 py-4 text-center text-gray-600 text-sm">
        GBC Analytics Dashboard &mdash; Built with Next.js, Supabase, Chart.js
      </footer>
    </div>
  );
}

function KPICard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  const gradients: Record<string, string> = {
    indigo: "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20",
    purple: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
    violet: "from-violet-500/10 to-violet-500/5 border-violet-500/20",
    fuchsia: "from-fuchsia-500/10 to-fuchsia-500/5 border-fuchsia-500/20",
  };
  return (
    <div
      className={`rounded-xl border bg-gradient-to-br p-5 ${gradients[color] || gradients.indigo}`}
    >
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-gray-500 text-xs mt-1">{sub}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}
