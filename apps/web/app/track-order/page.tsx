"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  Search,
  AlertCircle,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  MapPin,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { orderApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { getCourierTrackingUrl, identifyCourierPartner } from "@/lib/courier";
import styles from "../cart/commerce.module.scss";

const TRACKING_STEPS = [
  { key: "PLACED", label: "Order Placed", desc: "Batch reserved & verified" },
  { key: "PACKING", label: "Hand-Packing", desc: "Vacuum-sealed with gingelly oil" },
  { key: "DISPATCHED", label: "Dispatched", desc: "Handed over to courier partner" },
  { key: "IN_TRANSIT", label: "In Transit", desc: "Moving to destination hub" },
  { key: "DELIVERED", label: "Delivered", desc: "Arrived fresh at doorstep" },
];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId") || "";

  const [orderQuery, setOrderQuery] = useState(initialOrderId);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const { toast } = useToast();

  const handleTrack = async (idToFetch: string) => {
    const cleanId = idToFetch.trim();
    if (!cleanId) {
      toast("Please enter your Order ID or Order Number.", "error");
      return;
    }

    setLoading(true);
    try {
      // First try dedicated public tracking endpoint
      const res = await orderApi.track(cleanId).catch(() => orderApi.get(cleanId));
      if (res.data?.order) {
        setOrder(res.data.order);
      } else {
        toast("No shipment found. Please verify the order number.", "error");
      }
    } catch (err: any) {
      toast(
        err.response?.data?.message || "Could not find order. Please verify your Order ID.",
        "error"
      );
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      handleTrack(initialOrderId);
    }
  }, [initialOrderId]);

  const handleCopyAwb = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopiedAwb(true);
    toast("Tracking number copied to clipboard!", "success");
    setTimeout(() => setCopiedAwb(false), 2500);
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm("Are you sure you wish to cancel this order?")) return;

    setCancelling(true);
    try {
      await orderApi.cancel(order.id, "Customer requested cancellation via tracking portal");
      toast("Order cancelled successfully.", "info");
      handleTrack(order.id);
    } catch (err: any) {
      toast(err.response?.data?.message || "Cannot cancel this order at this stage.", "error");
    } finally {
      setCancelling(false);
    }
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT":
      case "CONFIRMED":
        return 0;
      case "PROCESSING":
      case "PACKED":
        return 1;
      case "DISPATCHED":
        return 2;
      case "IN_TRANSIT":
      case "OUT_FOR_DELIVERY":
        return 3;
      case "DELIVERED":
        return 4;
      case "CANCELLED":
      case "REFUND_INITIATED":
      case "REFUNDED":
      case "PAYMENT_FAILED":
        return -1;
      default:
        return 0;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : 0;
  const isCancelled = ["CANCELLED", "REFUND_INITIATED", "REFUNDED", "PAYMENT_FAILED"].includes(
    order?.status
  );

  const isDispatched = [
    "DISPATCHED",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ].includes(order?.status);

  // Compute direct external tracking URL
  const externalTrackingUrl =
    order?.trackingUrl ||
    getCourierTrackingUrl(order?.courier, order?.trackingNumber);

  const courierPartner = identifyCourierPartner(order?.courier);
  const courierDisplayName = order?.courier || courierPartner?.name || "Express Courier";

  return (
    <>
      <PageHero
        eyebrow="Live Consignment Tracking"
        title="Track Your Andhra Pickle Shipment"
        subtitle="Follow the journey of your traditional handmade Andhra pickles from our spice kitchen to your dining table."
      />

      <section className="section page" style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 20px" }}>
        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack(orderQuery);
          }}
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "32px",
            background: "var(--white)",
            padding: "8px",
            borderRadius: "10px",
            border: "1px solid var(--line)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
            <Search size={20} style={{ position: "absolute", left: "16px", color: "var(--muted)" }} />
            <input
              type="text"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder="Enter Order Number (e.g. UHT-XXXX) or Order ID"
              style={{
                width: "100%",
                padding: "14px 16px 14px 48px",
                border: "none",
                outline: "none",
                fontSize: "1rem",
                borderRadius: "6px",
              }}
            />
          </div>
          <button type="submit" className="button" disabled={loading} style={{ padding: "0 28px", fontWeight: 700 }}>
            {loading ? "Searching..." : "Track Order"}
          </button>
        </form>

        {/* Order Details Display */}
        {order && (
          <div style={{ display: "grid", gap: "24px" }}>
            {/* Header info */}
            <div
              style={{
                background: "var(--white)",
                borderRadius: "12px",
                padding: "26px",
                border: "1px solid var(--line)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "14px",
                  borderBottom: "1px solid var(--line)",
                  paddingBottom: "20px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <h2 style={{ margin: 0, fontSize: "1.4rem", color: "var(--green)" }}>
                      Order #{order.orderNumber || order.id}
                    </h2>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "5px 14px",
                        borderRadius: "999px",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        background: isCancelled
                          ? "#fee2e2"
                          : isDispatched
                          ? "#e0f2fe"
                          : "#dcfce7",
                        color: isCancelled
                          ? "#991b1b"
                          : isDispatched
                          ? "#0369a1"
                          : "#166534",
                      }}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "0.88rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={15} /> Placed on:{" "}
                    <strong>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </strong>
                  </p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block" }}>
                    Estimated Delivery
                  </span>
                  <strong style={{ fontSize: "1.05rem", color: "var(--brown)" }}>
                    {order.estimatedDelivery || "2-5 business days"}
                  </strong>
                </div>
              </div>

              {/* Courier Partner & Dispatch Notification Section */}
              <div style={{ margin: "24px 0" }}>
                {isDispatched ? (
                  <div
                    style={{
                      background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                      border: "1px solid #bae6fd",
                      borderRadius: "10px",
                      padding: "22px",
                      display: "grid",
                      gap: "16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            background: "#0284c7",
                            color: "#fff",
                            borderRadius: "8px",
                            padding: "10px",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <Truck size={24} />
                        </div>
                        <div>
                          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700, color: "#0369a1", letterSpacing: "0.5px" }}>
                            Assigned Courier Partner
                          </span>
                          <h3 style={{ margin: "2px 0 0", fontSize: "1.2rem", color: "#0c4a6e" }}>
                            {courierDisplayName}
                          </h3>
                        </div>
                      </div>

                      {order.trackingNumber && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              background: "#fff",
                              border: "1px solid #bae6fd",
                              padding: "8px 14px",
                              borderRadius: "6px",
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              color: "#0369a1",
                              letterSpacing: "0.5px",
                            }}
                          >
                            AWB: {order.trackingNumber}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyAwb(order.trackingNumber)}
                            title="Copy AWB number"
                            style={{
                              background: "#fff",
                              border: "1px solid #bae6fd",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.85rem",
                              color: "#0369a1",
                              fontWeight: 600,
                            }}
                          >
                            {copiedAwb ? <Check size={16} color="#166534" /> : <Copy size={16} />}
                            {copiedAwb ? "Copied" : "Copy"}
                          </button>
                        </div>
                      )}
                    </div>

                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#075985" }}>
                      Your package has been dispatched through <strong>{courierDisplayName}</strong>. You can follow live transit updates, delivery vehicle coordinates, and expected doorstep delivery timing on the courier partner's portal.
                    </p>

                    {/* Direct External Tracking Button */}
                    {externalTrackingUrl && (
                      <div style={{ marginTop: "4px" }}>
                        <a
                          href={externalTrackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 22px",
                            fontSize: "0.95rem",
                            background: "#0284c7",
                            borderColor: "#0284c7",
                            color: "#fff",
                            textDecoration: "none",
                            borderRadius: "8px",
                            fontWeight: 700,
                          }}
                        >
                          Track on {courierDisplayName} Website <ExternalLink size={17} />
                        </a>
                        <span style={{ display: "block", marginTop: "6px", fontSize: "0.78rem", color: "#64748b" }}>
                          Opens the official {courierDisplayName} tracking portal in a new tab.
                        </span>
                      </div>
                    )}
                  </div>
                ) : isCancelled ? (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "10px",
                      padding: "24px",
                      textAlign: "center",
                      color: "#991b1b",
                    }}
                  >
                    <XCircle size={44} style={{ margin: "0 auto 10px", color: "#dc2626" }} />
                    <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem" }}>This order has been cancelled</h3>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#7f1d1d" }}>
                      {order.cancellationReason || "Cancelled by customer"}. Any amount paid will be refunded within 5-7 business days.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "10px",
                      padding: "18px 22px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <Package size={28} style={{ color: "#166534", flexShrink: 0 }} />
                    <div>
                      <strong style={{ color: "#166534", display: "block", fontSize: "1rem" }}>
                        Order Confirmed — Hand-Packing In Progress
                      </strong>
                      <p style={{ margin: "2px 0 0", fontSize: "0.88rem", color: "#15803d" }}>
                        Your handmade Andhra pickle jars are being filled and vacuum-sealed with cold-pressed gingelly oil. Express courier partner (e.g. Blue Dart / Delhivery / DTDC) and tracking AWB will be updated immediately upon dispatch.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Steps */}
              {!isCancelled && (
                <div style={{ margin: "36px 0 24px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${TRACKING_STEPS.length}, 1fr)`,
                      gap: "8px",
                      position: "relative",
                    }}
                  >
                    {TRACKING_STEPS.map((step, idx) => {
                      const isComplete = idx <= currentStep;
                      const isCurrent = idx === currentStep;
                      return (
                        <div key={step.key} style={{ textAlign: "center" }}>
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "999px",
                              background: isComplete ? "var(--green)" : "#e2e8f0",
                              color: isComplete ? "#fff" : "var(--muted)",
                              display: "grid",
                              placeItems: "center",
                              margin: "0 auto 8px",
                              fontWeight: 700,
                              fontSize: "0.95rem",
                              boxShadow: isCurrent ? "0 0 0 4px rgba(24, 63, 44, 0.25)" : "none",
                              transition: "all 0.3s ease",
                            }}
                          >
                            {isComplete ? <CheckCircle size={20} /> : idx + 1}
                          </div>
                          <strong
                            style={{
                              display: "block",
                              fontSize: "0.85rem",
                              color: isComplete ? "var(--green)" : "var(--muted)",
                            }}
                          >
                            {step.label}
                          </strong>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--muted)",
                              display: "block",
                              marginTop: "2px",
                              lineHeight: 1.2,
                            }}
                          >
                            {step.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Timeline Log */}
              {order.timeline && order.timeline.length > 0 && (
                <div style={{ borderTop: "1px solid var(--line)", paddingTop: "20px", marginTop: "24px" }}>
                  <h4 style={{ margin: "0 0 14px", color: "var(--green)", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Activity Timeline
                  </h4>
                  <div style={{ display: "grid", gap: "10px" }}>
                    {order.timeline.map((ev: any, i: number) => (
                      <div
                        key={ev.id || i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          fontSize: "0.88rem",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "999px",
                            background: "var(--green)",
                            marginTop: "6px",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 700, color: "var(--brown)" }}>
                            {ev.status.replace(/_/g, " ")}
                          </span>
                          {ev.note && <span style={{ color: "var(--muted)", marginLeft: "8px" }}>— {ev.note}</span>}
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)", flexShrink: 0 }}>
                          {new Date(ev.createdAt).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items in order */}
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "20px", marginTop: "20px" }}>
                <h4 style={{ margin: "0 0 12px", color: "var(--brown)", fontSize: "1rem" }}>Items in This Shipment:</h4>
                <div style={{ display: "grid", gap: "10px" }}>
                  {order.items?.map((item: any) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "0.9rem",
                        padding: "8px 12px",
                        background: "#fafaf8",
                        borderRadius: "6px",
                      }}
                    >
                      <span>
                        <strong>{item.name || item.product?.name}</strong>{" "}
                        <span style={{ color: "var(--muted)" }}>({item.weight}) × {item.quantity}</span>
                      </span>
                      <strong>₹{item.total || Number(item.price) * item.quantity}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping address & cancellation */}
              <div
                style={{
                  borderTop: "1px solid var(--line)",
                  paddingTop: "16px",
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  {order.addressSnapshot && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={15} /> Delivering to:{" "}
                      <strong style={{ color: "var(--brown)" }}>
                        {order.addressSnapshot.city}, {order.addressSnapshot.state} - {order.addressSnapshot.pincode}
                      </strong>
                    </span>
                  )}
                </div>

                {["PENDING_PAYMENT", "CONFIRMED"].includes(order.status) && (
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    style={{
                      background: "none",
                      border: "1px solid #b5371b",
                      color: "#b5371b",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    {cancelling ? "Cancelling..." : "Cancel Order"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Demo Guide if no order loaded */}
        {!order && (
          <div className={styles.timeline} style={{ marginTop: "32px" }}>
            <article>
              <b>1</b>
              <span>Order Received: Authentic raw ingredients sorted and weighed with care.</span>
            </article>
            <article>
              <b>2</b>
              <span>Hand-packing: Pickles filled with cold-pressed oil and vacuum-sealed.</span>
            </article>
            <article>
              <b>3</b>
              <span>Dispatched via Blue Dart / Express Courier with official tracking link.</span>
            </article>
            <article>
              <b>4</b>
              <span>Delivered fresh to your home across all 28 states & UTs in India.</span>
            </article>
          </div>
        )}
      </section>
    </>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "60px" }}>Loading tracking information...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}

