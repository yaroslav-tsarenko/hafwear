import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkoutItemSchema, checkoutSchema } from "@/lib/validators/checkout";
import { getExtra, roundMoney, shippingCostFor, unitPrice, vatIncluded } from "@/lib/pricing";
import { getSessionUser } from "@/lib/auth";
import { resolveDiscount } from "@/lib/discounts";
import { spoynt } from "@/lib/payment/spoynt";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();

    const body = await request.json();
    const validated = checkoutSchema.parse(body);
    const itemsResult = z.array(checkoutItemSchema).min(1).safeParse(body.items);

    if (!itemsResult.success) {
      return NextResponse.json({ error: "Cart is empty or invalid" }, { status: 400 });
    }
    const items = itemsResult.data;

    if (!validated.contact.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Every amount below is computed from the database — the browser only says what was chosen.
    const productIds = [...new Set(items.map((item) => item.productId))];
    const variantIds = [...new Set(items.flatMap((item) => (item.variantId ? [item.variantId] : [])))];
    const [products, variants] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds } } }),
      variantIds.length
        ? prisma.productVariant.findMany({ where: { id: { in: variantIds } } })
        : Promise.resolve([]),
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: "A product in your bag is no longer available" }, { status: 400 });
      }

      const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
      if (item.variantId && (!variant || variant.productId !== product.id)) {
        return NextResponse.json({ error: "A size or colour in your bag is no longer available" }, { status: 400 });
      }

      const extra = getExtra(item.extraKey);
      const price = unitPrice({
        productPrice: Number(product.price),
        variantPrice: variant?.price == null ? null : Number(variant.price),
        extraKey: extra.key,
      });
      const itemTotal = roundMoney(price * item.quantity);
      subtotal = roundMoney(subtotal + itemTotal);

      orderItems.push({
        productId: product.id,
        productName: extra.nameSuffix ? `${product.name} ${extra.nameSuffix}` : product.name,
        productSku: variant?.sku ?? product.sku,
        variantName: variant?.name ?? null,
        quantity: item.quantity,
        price,
        total: itemTotal,
      });
    }

    const discount = await resolveDiscount({
      userId: user?.id ?? null,
      email: validated.contact.email,
      code: validated.discountCode ?? null,
    });

    const discountAmount = discount ? roundMoney(subtotal * (discount.percent / 100)) : 0;
    const discountedSubtotal = roundMoney(subtotal - discountAmount);

    // Prices are VAT-inclusive: derive the tax already contained in the price
    // rather than adding it on top of the total.
    const taxAmount = vatIncluded(discountedSubtotal);
    const shippingCost = shippingCostFor(validated.shippingMethod, discountedSubtotal);
    const total = roundMoney(discountedSubtotal + shippingCost);

    const storeSettings = await prisma.storeSettings.findFirst();
    const currency = storeSettings?.currency || "GBP";

    const order = await prisma.order.create({
      data: {
        userId: user?.id || null,
        customerName: `${validated.shipping.firstName} ${validated.shipping.lastName}`,
        customerEmail: validated.contact.email,
        customerPhone: validated.contact.phone,
        shippingAddress: validated.shipping,
        shippingMethod: validated.shippingMethod,
        shippingCost,
        subtotal,
        taxAmount,
        discountAmount,
        discountCode: discount?.code ?? null,
        discountPercent: discount?.percent ?? null,
        total,
        paymentMethod: "spoynt",
        items: { create: orderItems },
      },
      include: { items: true },
    });

    const locale = body.locale || "en";
    const invoice = await spoynt.createPaymentInvoice({
      orderId: order.id,
      amount: total,
      currency,
      email: validated.contact.email,
      locale,
      customerData: {
        firstName: validated.shipping.firstName,
        lastName: validated.shipping.lastName,
        phone: validated.contact.phone || undefined,
        address1: validated.shipping.address1,
        address2: validated.shipping.address2,
        city: validated.shipping.city,
        postCode: validated.shipping.postalCode,
        country: validated.shipping.country,
        region: validated.shipping.province,
      }
    });

    // Save the Spoynt cpi (payment invoice ID) to the order
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: invoice.data.id },
    });

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      redirectUrl: invoice.data.attributes.hpp_url,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
