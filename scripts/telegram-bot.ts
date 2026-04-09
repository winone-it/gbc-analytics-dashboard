/**
 * Telegram-бот для уведомлений о крупных заказах (> 50,000 ₸)
 *
 * Режимы:
 *   bun run scripts/telegram-bot.ts --get-chat-id   — получить chat_id (напиши боту /start)
 *   bun run scripts/telegram-bot.ts --test           — отправить тестовое уведомление
 *   bun run scripts/telegram-bot.ts                  — запустить polling (мониторинг RetailCRM)
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const RETAILCRM_URL = process.env.RETAILCRM_URL;
const RETAILCRM_API_KEY = process.env.RETAILCRM_API_KEY;

const THRESHOLD = 50000;
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

if (!BOT_TOKEN) {
  console.error("Set TELEGRAM_BOT_TOKEN in .env");
  process.exit(1);
}

async function sendMessage(chatId: string, text: string) {
  const res = await fetch(`${TG_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
  return res.json();
}

async function getChatId() {
  console.log("Waiting for messages... Send /start to the bot in Telegram\n");

  const res = await fetch(`${TG_API}/getUpdates?offset=-5`);
  const data = await res.json();

  if (!data.ok || !data.result?.length) {
    console.log("No messages yet. Send /start to the bot and run again.");
    return;
  }

  for (const update of data.result) {
    const chat = update.message?.chat;
    if (chat) {
      console.log(`Chat ID: ${chat.id}`);
      console.log(`User: ${chat.first_name || ""} ${chat.last_name || ""}`);
      console.log(`\nAdd to .env: TELEGRAM_CHAT_ID=${chat.id}`);
    }
  }
}

async function sendTestNotification() {
  if (!CHAT_ID) {
    console.error("Set TELEGRAM_CHAT_ID in .env");
    process.exit(1);
  }

  const text = `🔔 <b>Крупный заказ!</b>

👤 Клиент: Айгуль Касымова
📱 Телефон: +77001234501
🏙 Город: Алматы
💰 Сумма: <b>65,000 ₸</b>

📦 Товары:
• Корректирующее бельё Nova Classic × 2
• Утягивающий комбидресс Nova Slim × 1

🏷 Источник: instagram

<i>Это тестовое уведомление</i>`;

  const result = await sendMessage(CHAT_ID, text);
  if (result.ok) {
    console.log("Test notification sent successfully!");
  } else {
    console.error("Error:", result.description);
  }
}

async function pollRetailCRM() {
  if (!RETAILCRM_URL || !RETAILCRM_API_KEY) {
    console.error("Set RETAILCRM_URL and RETAILCRM_API_KEY in .env");
    process.exit(1);
  }
  if (!CHAT_ID) {
    console.error("Set TELEGRAM_CHAT_ID in .env");
    process.exit(1);
  }

  console.log(`Monitoring RetailCRM for orders > ${THRESHOLD.toLocaleString()} ₸`);
  console.log(`Checking every 60 seconds...\n`);

  const notified = new Set<string>();
  const sinceDate = new Date();
  sinceDate.setHours(sinceDate.getHours() - 1);

  async function check() {
    try {
      const filter = encodeURIComponent(
        JSON.stringify({
          createdAtFrom: sinceDate.toISOString().slice(0, 19),
        })
      );
      const url = `${RETAILCRM_URL}/api/v5/orders?apiKey=${RETAILCRM_API_KEY}&filter=${filter}&limit=50`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) {
        console.error("API error:", data.errorMsg);
        return;
      }

      for (const order of data.orders || []) {
        const id = String(order.id);
        if (notified.has(id)) continue;

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
                `• ${i.productName || "Товар"} × ${i.quantity || 1}`
            )
            .join("\n");

          const text = `🔔 <b>Крупный заказ!</b>

👤 Клиент: ${order.firstName || ""} ${order.lastName || ""}
📱 Телефон: ${order.phone || "—"}
🏙 Город: ${order.delivery?.address?.city || "—"}
💰 Сумма: <b>${total.toLocaleString()} ₸</b>

📦 Товары:
${items}

🏷 Источник: ${order.customFields?.utm_source || "direct"}`;

          await sendMessage(CHAT_ID, text);
          notified.add(id);
          console.log(
            `[${new Date().toLocaleTimeString()}] Notified: order #${id} — ${total.toLocaleString()} ₸`
          );
        }
      }
    } catch (e) {
      console.error("Check error:", e);
    }
  }

  await check();
  setInterval(check, 60_000);
}

// CLI routing
const arg = process.argv[2];
if (arg === "--get-chat-id") {
  getChatId();
} else if (arg === "--test") {
  sendTestNotification();
} else {
  pollRetailCRM();
}
