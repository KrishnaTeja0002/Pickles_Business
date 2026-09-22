import { prisma } from "../utils/prisma.js";

type NotificationType =
  | "ORDER_PLACED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_FAILED"
  | "ORDER_PROCESSING"
  | "ORDER_PACKED"
  | "ORDER_DISPATCHED"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "REFUND_INITIATED"
  | "REFUND_COMPLETED"
  | "WELCOME";

const templates: Record<NotificationType, { title: string; body: (data: Record<string, string>) => string }> = {
  ORDER_PLACED: {
    title: "Order Placed",
    body: (d) => `Your order ${d.orderNumber} has been placed successfully. We'll start preparing it soon!`,
  },
  PAYMENT_CONFIRMED: {
    title: "Payment Confirmed",
    body: (d) => `Payment of ₹${d.amount} for order ${d.orderNumber} has been confirmed.`,
  },
  PAYMENT_FAILED: {
    title: "Payment Failed",
    body: (d) => `Payment for order ${d.orderNumber} failed. Please retry or use a different payment method.`,
  },
  ORDER_PROCESSING: {
    title: "Order Being Prepared",
    body: (d) => `Your order ${d.orderNumber} is being prepared with care.`,
  },
  ORDER_PACKED: {
    title: "Order Packed",
    body: (d) => `Your order ${d.orderNumber} has been packed and is ready for dispatch.`,
  },
  ORDER_DISPATCHED: {
    title: "Order Dispatched",
    body: (d) => `Your order ${d.orderNumber} has been dispatched via ${d.courier || "our delivery partner"}. Tracking: ${d.trackingNumber || "will be updated shortly"}.`,
  },
  ORDER_DELIVERED: {
    title: "Order Delivered",
    body: (d) => `Your order ${d.orderNumber} has been delivered. Enjoy your pickles! 🌶️`,
  },
  ORDER_CANCELLED: {
    title: "Order Cancelled",
    body: (d) => `Your order ${d.orderNumber} has been cancelled. ${d.refundNote || ""}`,
  },
  REFUND_INITIATED: {
    title: "Refund Initiated",
    body: (d) => `A refund of ₹${d.amount} for order ${d.orderNumber} has been initiated. It may take 5-7 business days.`,
  },
  REFUND_COMPLETED: {
    title: "Refund Completed",
    body: (d) => `Refund of ₹${d.amount} for order ${d.orderNumber} has been processed successfully.`,
  },
  WELCOME: {
    title: "Welcome to Ur Home Taste!",
    body: (d) => `Hi ${d.name}, welcome to Ur Home Taste! Use code UHTWELCOME for 10% off your first order.`,
  },
};

export async function createNotification(
  userId: string,
  type: NotificationType,
  data: Record<string, string>
) {
  const template = templates[type];
  if (!template) return null;

  return prisma.notification.create({
    data: {
      userId,
      title: template.title,
      body: template.body(data),
      type,
    },
  });
}
