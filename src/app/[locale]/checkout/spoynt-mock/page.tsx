"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, Lock, Shield, ArrowLeft, CheckCircle2, AlertTriangle, HelpCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { OrderDetail } from "@/types/order";

function SpoyntMockContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const cpi = searchParams.get("cpi");
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulationStatus, setSimulationStatus] = useState<"idle" | "simulating" | "success" | "failed" | "pending">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    fetch(`/api/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Order not found");
        return res.json();
      })
      .then((data) => {
        setOrder(data);
      })
      .catch((err) => {
        console.error("Error fetching order for mock payment:", err);
        setErrorMessage("Could not load order details.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  const handleSimulate = async (status: "paid" | "failed" | "pending") => {
    if (!orderId) return;
    
    setSimulationStatus("simulating");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/payment/spoynt-mock-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status,
          cpi: cpi || "cpi_mock_123",
          amount: order ? Number(order.total) : 0,
          currency: "GBP",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Simulation request failed");
      }

      setSimulationStatus(status === "paid" ? "success" : status === "failed" ? "failed" : "pending");

      // Redirect after a brief delay to show completion state
      setTimeout(() => {
        const locale = window.location.pathname.split("/")[1] || "en";
        if (status === "paid") {
          window.location.href = `/${locale}/order/confirmed?orderId=${orderId}`;
        } else if (status === "pending") {
          window.location.href = `/${locale}/order/confirmed?orderId=${orderId}&status=pending`;
        } else {
          window.location.href = `/${locale}/checkout?error=payment_failed&orderId=${orderId}`;
        }
      }, 1500);

    } catch (err: any) {
      console.error("Simulation error:", err);
      setSimulationStatus("idle");
      setErrorMessage(err.message || "Failed to contact local webhook.");
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F5] p-6 text-[#1C1A17]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F4D3F]" />
        <p className="mt-4 text-sm font-medium">Connecting to Spoynt Secure Gateway...</p>
      </div>
    );
  }

  if (errorMessage && !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F5] p-6 text-[#1C1A17]">
        <AlertTriangle className="h-12 w-12 text-[#C65B3C]" />
        <h1 className="mt-4 text-xl font-serif font-medium">Secure Gateway Error</h1>
        <p className="mt-2 text-sm text-[#6B6560]">{errorMessage}</p>
        <button 
          onClick={() => window.history.back()}
          className="mt-6 flex items-center gap-2 rounded-lg bg-[#1C1A17] px-4 py-2 text-sm font-semibold text-[#FFFFFF] hover:bg-[#33302B] transition-colors"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  const formatPriceEur = (val: number) => {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1A17] font-sans antialiased flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-[#E4E0D9] bg-[#FFFFFF] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-[#1F4D3F]">Spoynt</span>
            <span className="rounded-full bg-[#EAF1EC] px-2.5 py-0.5 text-[10px] font-bold text-[#1F4D3F] uppercase tracking-wider">Gateway</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#6B6560] font-medium bg-[#FAF9F6] px-3 py-1.5 rounded-full border border-[#E4E0D9]">
            <Lock size={12} className="text-[#4E7A63]" />
            <span>256-Bit SSL Encryption</span>
          </div>
        </div>
      </header>

      {/* Main Panel */}
      <main className="mx-auto my-auto w-full max-w-5xl px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Order details */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="rounded-2xl border border-[#E4E0D9] bg-[#FFFFFF] p-6 shadow-[0_4px_20px_rgba(28,26,23,0.03)]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#96908A] mb-4">Order Summary</h2>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E4E0D9]">
              <div>
                <p className="font-serif text-lg font-medium text-[#1F4D3F]">Hafwear Store</p>
                <p className="text-xs text-[#96908A] mt-0.5">Order ID: #{order?.orderNumber.slice(-8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-serif font-bold text-[#1F4D3F]">{formatPriceEur(Number(order?.total || 0))}</p>
                <p className="text-[10px] text-[#96908A] uppercase tracking-widest font-bold">Total (EUR)</p>
              </div>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-3 mb-6 max-h-[220px] overflow-y-auto pr-1">
              {order?.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start gap-4 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate text-[#1C1A17]">{item.productName}</p>
                    <p className="text-xs text-[#96908A] mt-0.5">Qty {item.quantity} &bull; SKU: {item.productSku}</p>
                  </div>
                  <span className="font-semibold text-[#1C1A17]">{formatPriceEur(Number(item.total))}</span>
                </div>
              ))}
            </div>

            {/* Subtotals */}
            <div className="flex flex-col gap-2 pt-4 border-t border-[#E4E0D9] text-xs">
              <div className="flex justify-between text-[#6B6560]">
                <span>Subtotal</span>
                <span>{formatPriceEur(Number(order?.subtotal || 0))}</span>
              </div>
              <div className="flex justify-between text-[#6B6560]">
                <span>Shipping</span>
                <span>{Number(order?.shippingCost || 0) === 0 ? "Free" : formatPriceEur(Number(order?.shippingCost || 0))}</span>
              </div>
              <div className="flex justify-between text-[#6B6560]">
                <span>Tax</span>
                <span>Included</span>
              </div>
              {Number(order?.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-[#4E7A63] font-semibold">
                  <span>Discount</span>
                  <span>-{formatPriceEur(Number(order?.discountAmount || 0))}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#4E7A63]/20 bg-[#E7EFEA] p-4 flex gap-3 text-xs text-[#1F4D3F]">
            <Shield className="shrink-0 h-5 w-5 text-[#4E7A63]" />
            <div>
              <p className="font-bold">PCI-DSS Compliant Gateway</p>
              <p className="mt-0.5 text-[#6B6560] leading-relaxed">Spoynt secures your card details using advanced tokenization. Your card number is never shared with the merchant.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout form & Controls */}
        <div className="md:col-span-7 flex flex-col gap-6">
          <div className="rounded-2xl border border-[#E4E0D9] bg-[#FFFFFF] p-6 shadow-[0_4px_20px_rgba(28,26,23,0.03)] relative overflow-hidden">
            <AnimatePresence mode="wait">
              {simulationStatus === "idle" || simulationStatus === "simulating" ? (
                <motion.div
                  key="form"
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="font-serif text-xl font-medium mb-5 text-[#1F4D3F]">Card Details</h3>
                  
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#6B6560] mb-1.5 uppercase tracking-wide">Cardholder Name</label>
                      <input 
                        type="text" 
                        placeholder="John Doe" 
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full rounded-lg border border-[#E4E0D9] bg-[#FAF9F6] px-4 py-3 text-sm focus:border-[#1F4D3F] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#6B6560] mb-1.5 uppercase tracking-wide">Card Number</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          maxLength={19}
                          placeholder="4000 1234 5678 9010" 
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          className="w-full rounded-lg border border-[#E4E0D9] bg-[#FAF9F6] pl-4 pr-11 py-3 text-sm focus:border-[#1F4D3F] focus:outline-none transition-colors"
                        />
                        <CreditCard size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#96908A]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#6B6560] mb-1.5 uppercase tracking-wide">Expiry Date</label>
                        <input 
                          type="text" 
                          maxLength={5}
                          placeholder="MM/YY" 
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          className="w-full rounded-lg border border-[#E4E0D9] bg-[#FAF9F6] px-4 py-3 text-sm text-center focus:border-[#1F4D3F] focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#6B6560] mb-1.5 uppercase tracking-wide">CVV / CVC</label>
                        <input 
                          type="password" 
                          maxLength={3}
                          placeholder="•••" 
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, ""))}
                          className="w-full rounded-lg border border-[#E4E0D9] bg-[#FAF9F6] px-4 py-3 text-sm text-center focus:border-[#1F4D3F] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => handleSimulate("paid")}
                      disabled={simulationStatus === "simulating"}
                      className="w-full mt-2 rounded-xl bg-[#1F4D3F] py-3.5 text-sm font-semibold text-[#FFFFFF] shadow-sm hover:bg-[#163A2E] disabled:bg-[#96908A] transition-all flex items-center justify-center gap-2"
                    >
                      {simulationStatus === "simulating" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Lock size={14} />
                          <span>Pay {formatPriceEur(Number(order?.total || 0))}</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="status"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 flex flex-col items-center justify-center text-center"
                >
                  {simulationStatus === "success" && (
                    <>
                      <div className="h-16 w-16 bg-[#E7EFEA] text-[#4E7A63] rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 size={36} />
                      </div>
                      <h3 className="font-serif text-2xl font-semibold text-[#1F4D3F]">Payment Successful</h3>
                      <p className="text-sm text-[#6B6560] mt-2">Your payment has been processed successfully.</p>
                      <p className="text-xs text-[#96908A] mt-1">Redirecting you back to Hafwear Store...</p>
                    </>
                  )}

                  {simulationStatus === "pending" && (
                    <>
                      <div className="h-16 w-16 bg-[#F6ECD9] text-[#B77A1F] rounded-full flex items-center justify-center mb-4">
                        <HelpCircle size={36} />
                      </div>
                      <h3 className="font-serif text-2xl font-semibold text-[#B77A1F]">Payment Pending</h3>
                      <p className="text-sm text-[#6B6560] mt-2">Your payment is currently being authorized.</p>
                      <p className="text-xs text-[#96908A] mt-1">Redirecting you back to Hafwear Store...</p>
                    </>
                  )}

                  {simulationStatus === "failed" && (
                    <>
                      <div className="h-16 w-16 bg-[#F4DCD5] text-[#C65B3C] rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle size={36} />
                      </div>
                      <h3 className="font-serif text-2xl font-semibold text-[#C65B3C]">Payment Declined</h3>
                      <p className="text-sm text-[#6B6560] mt-2">The bank has declined this transaction.</p>
                      <p className="text-xs text-[#96908A] mt-1">Redirecting you to retry checkout...</p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Developer Sandbox Panel */}
          <div className="rounded-2xl border border-dashed border-[#C65B3C]/40 bg-[#FBF6F4] p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="rounded-md bg-[#F4DCD5] px-2 py-0.5 text-[10px] font-bold text-[#C65B3C] uppercase tracking-wider">Sandbox</span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#C65B3C]">Developer Controls</h3>
            </div>
            <p className="text-xs text-[#6B6560] mb-4">You are in mock payment mode since `SPOYNT_API_KEY` is not set. Use the buttons below to simulate different payment gateway outcomes.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button 
                onClick={() => handleSimulate("paid")}
                disabled={simulationStatus !== "idle"}
                className="rounded-lg bg-[#4E7A63] px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#3D614E] disabled:bg-[#96908A] transition-colors shadow-sm"
              >
                Force Success
              </button>
              <button 
                onClick={() => handleSimulate("pending")}
                disabled={simulationStatus !== "idle"}
                className="rounded-lg bg-[#B77A1F] px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#996517] disabled:bg-[#96908A] transition-colors shadow-sm"
              >
                Force Pending
              </button>
              <button 
                onClick={() => handleSimulate("failed")}
                disabled={simulationStatus !== "idle"}
                className="rounded-lg bg-[#B54634] px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#943728] disabled:bg-[#96908A] transition-colors shadow-sm"
              >
                Force Decline
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 text-xs font-semibold text-[#B54634] bg-[#F4DCD5] rounded-lg p-3">
                Error: {errorMessage}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#FFFFFF] border-t border-[#E4E0D9] py-4 px-6 text-center text-[10px] text-[#96908A] font-medium">
        <div className="mx-auto max-w-5xl flex flex-wrap justify-between items-center gap-2">
          <span>&copy; {new Date().getFullYear()} Spoynt Inc. All rights reserved. Registered PCI-DSS Level 1 Provider.</span>
          <span className="flex gap-4">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Contact Support</a>
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function SpoyntMockPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F5]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F4D3F]" />
      </div>
    }>
      <SpoyntMockContent />
    </Suspense>
  );
}
