export interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  variantId?: string;
  variantName?: string;
  /** Paid add-on chosen on the product page (see PRODUCT_EXTRAS); absent means none. */
  extraKey?: string;
  maxQuantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  total: number;
  itemCount: number;
}
