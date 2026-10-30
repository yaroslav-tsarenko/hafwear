import crypto from "crypto";

export interface SpoyntInvoiceAttributes {
  reference_id: string;
  status: string;
  resolution: string;
  amount: number;
  currency: string;
  hpp_url: string;
  flow_data?: {
    action: string;
    method: string;
    params: Record<string, string>;
  };
}

export interface SpoyntInvoiceResponse {
  data: {
    type: "payment-invoices";
    id: string;
    attributes: SpoyntInvoiceAttributes;
  };
}

class SpoyntService {
  private apiUrl: string;
  private merchantId: string | undefined;
  private apiKey: string | undefined;
  private privateKey: string | undefined;
  private testMode: boolean;

  constructor() {
    this.apiUrl = (process.env.SPOYNT_API_URL || "https://api.spoynt.com").replace(/\/+$/, "");
    this.merchantId = process.env.SPOYNT_MERCHANT_ID || "coma_s2nFrHr41u0sJDzl";
    this.apiKey = process.env.SPOYNT_API_KEY;
    this.privateKey = process.env.SPOYNT_PRIVATE_KEY;
    this.testMode = process.env.SPOYNT_TEST_MODE === "true" || !this.apiKey;
  }

  isMockMode(): boolean {
    // Mock payments are for local development only. A production build without
    // keys must never accept fake payments — it shares the order database.
    return !process.env.SPOYNT_API_KEY && process.env.NODE_ENV !== "production";
  }

  /** Real keys are present, or we're in local mock mode. */
  isConfigured(): boolean {
    return !!(process.env.SPOYNT_API_KEY && process.env.SPOYNT_PRIVATE_KEY) || this.isMockMode();
  }

  async createPaymentInvoice(params: {
    orderId: string;
    amount: number;
    currency: string;
    email: string;
    locale: string;
    customerData?: {
      firstName: string;
      lastName: string;
      phone?: string;
      address1: string;
      address2?: string | null;
      city: string;
      postCode: string;
      country: string;
      region?: string | null;
    };
  }): Promise<SpoyntInvoiceResponse> {
    let siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:9999").replace(/\/+$/, "");
    // Strip trailing locale from siteUrl if configured with one (e.g., /en) to avoid double locale pathing
    siteUrl = siteUrl.replace(/\/(en|lv)$/i, "");
    
    // Construct return URLs with correct locale
    const localizedSuccessUrl = `${siteUrl}/${params.locale}/order/confirmed?orderId=${params.orderId}`;
    const localizedFailUrl = `${siteUrl}/${params.locale}/checkout?error=payment_failed&orderId=${params.orderId}`;
    const localizedPendingUrl = `${siteUrl}/${params.locale}/order/confirmed?orderId=${params.orderId}&status=pending`;
    // Spoynt restricts localhost URLs for callback_url. If local, fallback to public URL for validation.
    const cleanSiteUrl = siteUrl.includes("localhost") || siteUrl.includes("127.0.0.1")
      ? "https://hafwear.com"
      : siteUrl;
    const callbackUrl = `${cleanSiteUrl}/api/payment/spoynt-callback`;

    // Dynamic service name based on currency
    const currencyLower = params.currency.toLowerCase();
    const serviceName = `payment_card_${currencyLower}_hpp`;

    // reference_id contains orderId and timestamp to make it unique per checkout attempt
    const referenceId = `${params.orderId}-${Date.now()}`;

    if (!this.isConfigured()) {
      throw new Error("Payments are not configured: set SPOYNT_API_KEY and SPOYNT_PRIVATE_KEY");
    }

    if (this.isMockMode()) {
      console.log(`[Spoynt Mock] Creating mock payment invoice for order: ${params.orderId}`);
      const mockCpiId = `cpi_${crypto.randomBytes(8).toString("hex")}`;
      const hppUrl = `/${params.locale}/checkout/spoynt-mock?orderId=${params.orderId}&cpi=${mockCpiId}`;

      return {
        data: {
          type: "payment-invoices",
          id: mockCpiId,
          attributes: {
            reference_id: referenceId,
            status: "process_pending",
            resolution: "ok",
            amount: params.amount,
            currency: params.currency,
            hpp_url: hppUrl,
            flow_data: {
              action: `${siteUrl}${hppUrl}`,
              method: "GET",
              params: {},
            },
          },
        },
      };
    }

    // Prepare Customer billing metadata
    let customerObj: any = {
      reference_id: params.email,
      name: `${params.customerData?.firstName || ""} ${params.customerData?.lastName || ""}`.trim() || params.email,
      email: params.email,
      phone: params.customerData?.phone || undefined,
    };

    if (params.customerData) {
      const fullAddress = [
        params.customerData.address1,
        params.customerData.address2,
        params.customerData.postCode,
        params.customerData.city,
        params.customerData.country
      ].filter(Boolean).join(", ");

      customerObj.address = {
        country: params.customerData.country,
        city: params.customerData.city,
        full_address: fullAddress,
        post_code: params.customerData.postCode,
        region: params.customerData.region || params.customerData.city,
      };
    }

    // Real API Call
    const requestBody = {
      data: {
        type: "payment-invoices",
        attributes: {
          reference_id: referenceId,
          currency: params.currency,
          amount: params.amount,
          service: serviceName,
          test_mode: this.testMode,
          description: `Payment for Order #${params.orderId}`,
          callback_url: callbackUrl,
          return_urls: {
            success: localizedSuccessUrl,
            fail: localizedFailUrl,
            pending: localizedPendingUrl,
          },
          customer: customerObj,
          gateway_options: {
            cardgate: {
              theme_options: {
                logo: `${siteUrl}/icon.svg`,
                favicon: `${siteUrl}/favicon.ico`,
                powered_by: "false",
                card_holder: "true",
                logo_height: "32",
                btn_bg_color: "#E53935", // Brand color
                merchant_name: "Hafwear Store",
                btn_font_color: "#ffffff",
                window_title: "Hafwear Secure Payment",
              },
            },
          },
        },
      },
    };

    console.log(`[Spoynt API] Requesting payment invoice creation for order ${params.orderId} (Service: ${serviceName})`);
    
    // Basic Authentication header using Merchant ID and API Key
    const authString = Buffer.from(`${this.merchantId}:${this.apiKey}`).toString("base64");

    const response = await fetch(`${this.apiUrl}/payment-invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Spoynt API] Create invoice failed: ${response.status}`, errorText);
      throw new Error(`Spoynt invoice creation failed: ${response.statusText}`);
    }

    return (await response.json()) as SpoyntInvoiceResponse;
  }

  verifyCallbackSignature(rawBody: string, signature: string | null): boolean {
    // The development fallback key is public — only trust it in local mock mode.
    if (!this.privateKey && !this.isMockMode()) {
      console.error("[Spoynt] SPOYNT_PRIVATE_KEY is not set; rejecting callback.");
      return false;
    }
    const verificationKey = this.privateKey || "local-development-private-key-123";

    if (!signature) {
      console.error("[Spoynt] Missing signature header.");
      return false;
    }

    // Spoynt Signature algorithm (SHA1): base64(sha1(key + rawBody + key, true))
    const hash = crypto.createHash("sha1")
      .update(verificationKey + rawBody + verificationKey)
      .digest();
    
    const calculatedSignature = hash.toString("base64");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, "base64"),
        Buffer.from(calculatedSignature, "base64")
      );
    } catch {
      return signature === calculatedSignature;
    }
  }

  generateMockCallbackSignature(bodyObj: any): string {
    const rawBody = JSON.stringify(bodyObj);
    const verificationKey = this.privateKey || "local-development-private-key-123";
    const hash = crypto.createHash("sha1")
      .update(verificationKey + rawBody + verificationKey)
      .digest();
    return hash.toString("base64");
  }
}

export const spoynt = new SpoyntService();
