/**
 * Webhook endpoint for RetailCRM order notifications.
 * RetailCRM can call this URL when a new order is created.
 * If order total > 50,000 ₸, sends Telegram notification.
 *
 * Setup: In RetailCRM → Settings → Triggers → Add webhook URL:
 * https://your-app.vercel.app/api/webhook
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const THRESHOLD = 50000;

async function sendTelegram(text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
    }),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Support both direct order data and RetailCRM webhook format
    const order = body.order || body;
    const total =
      order.totalSumm ||
      (order.items || []).reduce(
        (s: number, i: { initialPrice?: number; quantity?: number }) =>
          s + (i.initialPrice || 0) * (i.quantity || 1),
        0
      );

    if (total > THRESHOLD) {
      const items = (order.items || [])
        .map(
          (i: { productName?: string; quantity?: number }) =>
            `- ${i.productName || "Item"} x${i.quantity || 1}`
        )
        .join("\n");

      const text = `🔔 <b>New large order!</b>

👤 ${order.firstName || ""} ${order.lastName || ""}
📱 ${order.phone || "—"}
🏙 ${order.delivery?.address?.city || "—"}
💰 <b>${total.toLocaleString()} ₸</b>

📦 Items:
${items}

🏷 Source: ${order.customFields?.utm_source || "direct"}`;

      await sendTelegram(text);
    }

    return Response.json({ ok: true, notified: total > THRESHOLD });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 400 }
    );
  }
}
