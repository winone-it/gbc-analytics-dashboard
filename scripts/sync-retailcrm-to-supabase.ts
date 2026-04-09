/**
 * Синхронизация заказов из RetailCRM → Supabase
 * Использование: bun run scripts/sync-retailcrm-to-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";

const RETAILCRM_URL = process.env.RETAILCRM_URL!;
const RETAILCRM_API_KEY = process.env.RETAILCRM_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!RETAILCRM_URL || !RETAILCRM_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing env vars. Check .env file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const API = `${RETAILCRM_URL}/api/v5`;

interface RetailCRMOrder {
  id: number;
  externalId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  status?: string;
  totalSumm?: number;
  items?: Array<{
    productName?: string;
    quantity?: number;
    initialPrice?: number;
  }>;
  delivery?: {
    address?: {
      city?: string;
      text?: string;
    };
  };
  customFields?: Record<string, string>;
  createdAt?: string;
}

async function fetchOrders(): Promise<RetailCRMOrder[]> {
  const allOrders: RetailCRMOrder[] = [];
  let page = 1;

  while (true) {
    const url = `${API}/orders?apiKey=${RETAILCRM_API_KEY}&limit=100&page=${page}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) {
      console.error("RetailCRM API error:", data.errorMsg);
      break;
    }

    allOrders.push(...data.orders);
    console.log(`Fetched page ${page}: ${data.orders.length} orders`);

    if (page >= (data.pagination?.totalPageCount || 1)) break;
    page++;
    await new Promise((r) => setTimeout(r, 300));
  }

  return allOrders;
}

async function syncToSupabase(orders: RetailCRMOrder[]) {
  const rows = orders.map((o) => {
    const total =
      o.totalSumm ||
      (o.items || []).reduce(
        (s, i) => s + (i.initialPrice || 0) * (i.quantity || 1),
        0
      );

    return {
      external_id: o.externalId || `crm-${o.id}`,
      retailcrm_id: String(o.id),
      first_name: o.firstName || "",
      last_name: o.lastName || "",
      phone: o.phone || "",
      email: o.email || "",
      status: o.status || "new",
      city: o.delivery?.address?.city || "",
      address: o.delivery?.address?.text || "",
      total_amount: total,
      utm_source: o.customFields?.utm_source || "direct",
      items: o.items || [],
      created_at: o.createdAt || new Date().toISOString(),
    };
  });

  // Upsert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from("orders")
      .upsert(batch, { onConflict: "external_id" });

    if (error) {
      console.error(`Batch ${i / 50 + 1} error:`, error.message);
    } else {
      console.log(
        `Synced batch ${i / 50 + 1}: ${batch.length} orders`
      );
    }
  }
}

async function main() {
  console.log("Fetching orders from RetailCRM...");
  const orders = await fetchOrders();
  console.log(`\nTotal orders: ${orders.length}`);

  console.log("\nSyncing to Supabase...");
  await syncToSupabase(orders);

  console.log("\nSync complete!");
}

main();
