"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, FileText, PackageCheck, Truck, ArrowRight, Printer, Sparkles } from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { orderApi } from "@/lib/api";
import styles from "../cart/commerce.module.scss";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    orderApi
      .get(orderId)
      .then((res) => {
        if (res.data?.order) {
          setOrder(res.data.order);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch order details:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  return (
    <>
      <PageHero
        eyebrow="Order Placed Successfully"
        title="Your Handmade Pickle Jars are Reserved!"
        subtitle="Thank you for ordering authentic Andhra style pickles. We're hand-packing your jar with traditional care."
      />

      <section className={`section page ${styles.panel}`} style={{ maxWidth: "780px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", padding: "16px 0 24px", borderBottom: "1px solid var(--line)" }}>
          <CheckCircle2 size={56} style={{ color: "#166534", margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: "1.6rem", color: "var(--green)", justifyContent: "center" }}>
            Order #{order?.orderNumber || "UHT-20260907"}
          </h2>
          <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
            Payment Status:{" "}
            <span style={{ color: "#166534", fontWeight: 700 }}>
              {order?.payment?.status || order?.paymentStatus || "CONFIRMED"}
            </span>{" "}
            · Order Status:{" "}
            <span style={{ color: "var(--brown)", fontWeight: 700 }}>
              {order?.status || "CONFIRMED"}
            </span>
          </p>
        </div>

        {/* Order Details */}
        {order && (
          <div style={{ padding: "16px 0", display: "grid", gap: "16px", borderBottom: "1px solid var(--line)" }}>
            <h3 style={{ color: "var(--green)", margin: 0 }}>Items in This Batch</h3>
            <div style={{ display: "grid", gap: "10px" }}>
              {order.items?.map((item: any) => (
                <div
                  key={item.id}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div>
                    <strong>{item.name || item.productName || item.product?.name || "Pickle Jar"}</strong>
                    <span style={{ color: "var(--muted)", fontSize: "0.85rem", display: "block" }}>
                      {item.weight || item.variantWeight || item.variant?.weight || "500g"} × {item.quantity}
                    </span>
                  </div>
                  <strong>₹{item.total || item.totalPrice || (item.price || item.unitPrice || 0) * item.quantity}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gap: "6px", fontSize: "0.9rem", color: "var(--muted)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#166534" }}>
                  <span>Discount</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Shipping</span>
                <span>{Number(order.deliveryCharge ?? order.shippingFee ?? 0) === 0 ? "FREE" : `₹${order.deliveryCharge ?? order.shippingFee}`}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.15rem", fontWeight: 700, color: "var(--brown)" }}>
                <span>Grand Total</span>
                <span>₹{order.total}</span>
              </div>
            </div>

            {/* Delivery address */}
            {(order.addressSnapshot || order.shippingAddress) && (() => {
              const addr = order.addressSnapshot || order.shippingAddress;
              return (
                <div style={{ background: "#fafaf8", padding: "14px", borderRadius: "8px", border: "1px solid var(--line)" }}>
                  <h4 style={{ margin: "0 0 6px", color: "var(--green)" }}>Shipping To:</h4>
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--brown)" }}>
                    {addr.fullName || addr.name} · {addr.phone}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
                    {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ""}{addr.city}, {addr.state} - {addr.pincode}
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginTop: "16px" }}>
          {orderId && (
            <Link className="button" href={`/track-order?orderId=${orderId}`} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <Truck size={16} /> Track Order Progress
            </Link>
          )}
          <Link className="button secondary" href="/shop" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={16} /> Continue Shopping
          </Link>
          <button
            type="button"
            className="button secondary"
            onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <Printer size={16} /> Print Receipt
          </button>
        </div>
      </section>
    </>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "60px" }}>Loading confirmation...</div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
