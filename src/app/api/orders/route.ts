import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Aggregate data for charts
  const totalRevenue = orders.reduce(
    (s, o) => s + Number(o.total_amount),
    0
  );
  const orderCount = orders.length;
  const avgOrder = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;
  const bigOrders = orders.filter((o) => Number(o.total_amount) > 50000).length;

  // By city
  const byCity: Record<string, { count: number; revenue: number }> = {};
  for (const o of orders) {
    const city = o.city || "Other";
    if (!byCity[city]) byCity[city] = { count: 0, revenue: 0 };
    byCity[city].count++;
    byCity[city].revenue += Number(o.total_amount);
  }

  // By UTM source
  const byUtm: Record<string, { count: number; revenue: number }> = {};
  for (const o of orders) {
    const utm = o.utm_source || "direct";
    if (!byUtm[utm]) byUtm[utm] = { count: 0, revenue: 0 };
    byUtm[utm].count++;
    byUtm[utm].revenue += Number(o.total_amount);
  }

  // By status
  const byStatus: Record<string, number> = {};
  for (const o of orders) {
    const status = o.status || "unknown";
    byStatus[status] = (byStatus[status] || 0) + 1;
  }

  // Revenue distribution (histogram buckets)
  const buckets = [
    { label: "0-15K", min: 0, max: 15000 },
    { label: "15-30K", min: 15000, max: 30000 },
    { label: "30-50K", min: 30000, max: 50000 },
    { label: "50-75K", min: 50000, max: 75000 },
    { label: "75K+", min: 75000, max: Infinity },
  ];
  const distribution = buckets.map((b) => ({
    label: b.label,
    count: orders.filter(
      (o) => Number(o.total_amount) >= b.min && Number(o.total_amount) < b.max
    ).length,
  }));

  // Top products
  const productMap: Record<string, { count: number; revenue: number }> = {};
  for (const o of orders) {
    for (const item of o.items || []) {
      const name = item.productName || "Unknown";
      if (!productMap[name]) productMap[name] = { count: 0, revenue: 0 };
      productMap[name].count += item.quantity || 1;
      productMap[name].revenue += (item.initialPrice || 0) * (item.quantity || 1);
    }
  }
  const topProducts = Object.entries(productMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10)
    .map(([name, data]) => ({ name, ...data }));

  return Response.json({
    summary: { totalRevenue, orderCount, avgOrder, bigOrders },
    byCity,
    byUtm,
    byStatus,
    distribution,
    topProducts,
    orders: orders.map((o) => ({
      id: o.id,
      name: `${o.first_name} ${o.last_name}`,
      city: o.city,
      total: Number(o.total_amount),
      utm: o.utm_source,
      status: o.status,
      date: o.created_at,
    })),
  });
}
