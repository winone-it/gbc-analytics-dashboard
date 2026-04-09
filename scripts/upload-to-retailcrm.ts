/**
 * Загрузка 50 тестовых заказов из mock_orders.json в RetailCRM
 * Использование: bun run scripts/upload-to-retailcrm.ts
 */

import orders from "../mock_orders.json";

const RETAILCRM_URL = process.env.RETAILCRM_URL!;
const RETAILCRM_API_KEY = process.env.RETAILCRM_API_KEY!;

if (!RETAILCRM_URL || !RETAILCRM_API_KEY) {
  console.error("Set RETAILCRM_URL and RETAILCRM_API_KEY in .env");
  process.exit(1);
}

const API = `${RETAILCRM_URL}/api/v5`;

async function createOrder(order: (typeof orders)[0], index: number) {
  const body = new URLSearchParams();
  body.append("apiKey", RETAILCRM_API_KEY);

  const orderData = {
    externalId: `mock-${Date.now()}-${index}`,
    orderType: "main",
    orderMethod: order.orderMethod,
    status: order.status,
    firstName: order.firstName,
    lastName: order.lastName,
    phone: order.phone,
    email: order.email,
    items: order.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      initialPrice: item.initialPrice,
    })),
    delivery: {
      address: {
        city: order.delivery.address.city,
        text: order.delivery.address.text,
      },
    },
    customFields: order.customFields,
  };

  body.append("order", JSON.stringify(orderData));

  const res = await fetch(`${API}/orders/create`, {
    method: "POST",
    body,
  });

  const data = await res.json();
  if (!data.success) {
    console.error(`[${index + 1}] Error:`, data.errorMsg || data.errors);
    return false;
  }
  const total = order.items.reduce(
    (s, i) => s + i.initialPrice * i.quantity,
    0
  );
  console.log(
    `[${index + 1}/50] Order #${data.id} — ${order.firstName} ${order.lastName} — ${total} ₸`
  );
  return true;
}

async function main() {
  console.log(`Uploading ${orders.length} orders to RetailCRM...`);
  console.log(`URL: ${RETAILCRM_URL}\n`);

  let success = 0;
  let fail = 0;

  for (let i = 0; i < orders.length; i++) {
    const ok = await createOrder(orders[i], i);
    if (ok) success++;
    else fail++;

    // RetailCRM rate limit: ~10 req/sec
    if ((i + 1) % 5 === 0) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  console.log(`\nDone! Success: ${success}, Failed: ${fail}`);
}

main();
