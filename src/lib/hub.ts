import { prisma } from "./prisma";

export interface HubOrderPayload {
  site_name: string;
  site_url: string;
  order_id: string;
  admin_url: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  items: Array<{
    name: string;
    qty: number;
    price: number;
    total: number;
  }>;
  total: number;
  currency: string;
}

export async function sendOrderToHub(orderId: string): Promise<boolean> {
  const hubUrl = process.env.HUB_API_URL;
  const apiKey = process.env.HUB_API_KEY;
  const siteName = process.env.HUB_SITE_NAME || "Tool Haven";

  if (!hubUrl || !apiKey) {
    console.log("[Hub Integration] Skipped (HUB_API_URL or HUB_API_KEY not configured in .env)");
    return false;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      console.error(`[Hub Integration] Order ${orderId} not found.`);
      return false;
    }

    const storeSettings = await prisma.storeSettings.findFirst();
    const currency = storeSettings?.currency || "GBP";

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://hafwear.com").replace(/\/+$/, "");
    const adminUrl = `${siteUrl}/admin/orders/${order.id}`;

    // Parse the shippingAddress JSON stored on the order
    const address = (order.shippingAddress || {}) as any;

    const payload: HubOrderPayload = {
      site_name: siteName,
      site_url: siteUrl,
      order_id: order.orderNumber,
      admin_url: adminUrl,
      billing: {
        first_name: address.firstName || "",
        last_name: address.lastName || "",
        email: order.customerEmail,
        phone: order.customerPhone || address.phone || "",
        address_1: address.address1 || "",
        address_2: address.address2 || "",
        city: address.city || "",
        state: address.province || "",
        postcode: address.postalCode || "",
        country: address.country || "",
      },
      items: order.items.map((item) => ({
        name: item.productName,
        qty: item.quantity,
        price: Number(item.price),
        total: Number(item.total),
      })),
      total: Number(order.total),
      currency: currency,
    };

    console.log(`[Hub Integration] Posting order #${order.orderNumber} to Hub at: ${hubUrl}`);

    const response = await fetch(hubUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Hub Integration] Post failed with status ${response.status}:`, errorText);
      return false;
    }

    console.log(`[Hub Integration] Order #${order.orderNumber} successfully posted to Hub.`);
    return true;
  } catch (error) {
    console.error("[Hub Integration] Exception while posting order to Hub:", error);
    return false;
  }
}
