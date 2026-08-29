export const orderStatuses = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "REFUNDED"
] as const;

export const paymentMethods = ["RAZORPAY", "UPI", "GOOGLE_PAY", "PHONEPE", "PAYTM", "BHIM", "COD"] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
