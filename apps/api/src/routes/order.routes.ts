import { Router } from "express";
import { z } from "zod";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { createNotification } from "../services/notification.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { HttpError } from "../utils/http-error.js";
import { prisma } from "../utils/prisma.js";

export const orderRouter = Router();

// COURIER TRACKING URL HELPER
export function getTrackingUrl(courier?: string | null, trackingNumber?: string | null): string | null {
  if (!trackingNumber) return null;
  const awb = encodeURIComponent(trackingNumber.trim());
  const c = (courier || "").toLowerCase().trim();

  if (c.includes("blue dart") || c.includes("bluedart")) {
    return `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${awb}`;
  }
  if (c.includes("delhivery")) {
    return `https://www.delhivery.com/track/package/${awb}`;
  }
  if (c.includes("dtdc")) {
    return `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb_no&strCNNo=${awb}`;
  }
  if (c.includes("india post") || c.includes("speed post") || c.includes("post")) {
    return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`;
  }
  if (c.includes("shiprocket")) {
    return `https://shiprocket.co/tracking/${awb}`;
  }
  if (c.includes("ekart")) {
    return `https://ekartlogistics.com/shipmenttrack/${awb}`;
  }
  if (c.includes("shadowfax")) {
    return `https://tracker.shadowfax.in/#/track/${awb}`;
  }
  if (c.includes("ecom express") || c.includes("ecom")) {
    return `https://ecomexpress.in/tracking/?awb_number=${awb}`;
  }
  if (c) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${courier} tracking ${trackingNumber.trim()}`)}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`courier tracking ${trackingNumber.trim()}`)}`;
}

// ─── PUBLIC TRACKING ENDPOINT (by orderNumber or ID) ───
orderRouter.get(
  "/track/:query",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const rawQuery = (req.params.query || "").trim();
    if (!rawQuery) throw new HttpError(400, "Order number or ID required");

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: { equals: rawQuery, mode: "insensitive" } },
          { id: rawQuery },
        ],
      },
      include: {
        items: {
          include: {
            product: { select: { slug: true, images: true, name: true } },
          },
        },
        payment: { select: { status: true, method: true, transactionId: true } },
        timeline: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) {
      throw new HttpError(404, `No order found matching "${rawQuery}"`);
    }

    const trackingUrl = getTrackingUrl(order.courier, order.trackingNumber);

    res.json({
      order: {
        ...order,
        trackingUrl,
      },
    });
  })
);

// ─── LIST MY ORDERS (Authenticated) ───
orderRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: req.user!.id },
        include: {
          items: { include: { product: { select: { slug: true, images: true, name: true } } } },
          payment: { select: { status: true, method: true, transactionId: true } },
          timeline: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where: { userId: req.user!.id } }),
    ]);

    const formattedOrders = orders.map((o) => ({
      ...o,
      trackingUrl: getTrackingUrl(o.courier, o.trackingNumber),
    }));

    res.json({ orders: formattedOrders, pagination: { total, page, pages: Math.ceil(total / limit) } });
  })
);

// ─── GET SINGLE ORDER (By ID or orderNumber, with fallback) ───
orderRouter.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const query = req.params.id.trim();

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: query },
          { orderNumber: { equals: query, mode: "insensitive" } },
        ],
      },
      include: {
        items: {
          include: {
            product: { select: { slug: true, images: true, name: true } },
          },
        },
        payment: true,
        timeline: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) throw new HttpError(404, "Order not found");

    res.json({
      order: {
        ...order,
        trackingUrl: getTrackingUrl(order.courier, order.trackingNumber),
      },
    });
  })
);

// ─── CREATE ORDER (Guest & Authenticated, COD & Online) ───
orderRouter.post(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        addressId: z.string().optional(),
        shippingAddress: z
          .object({
            name: z.string(),
            phone: z.string(),
            line1: z.string(),
            line2: z.string().optional(),
            city: z.string(),
            state: z.string(),
            pincode: z.string(),
            country: z.string().optional(),
          })
          .optional(),
        guestCustomer: z
          .object({
            name: z.string(),
            email: z.string().email(),
            phone: z.string().optional(),
          })
          .optional(),
        items: z
          .array(
            z.object({
              productId: z.string(),
              variantId: z.string(),
              quantity: z.number().int().min(1),
              unitPrice: z.number().optional(),
            })
          )
          .min(1),
        couponCode: z.string().optional(),
        paymentMethod: z
          .enum(["RAZORPAY", "UPI", "GOOGLE_PAY", "PHONEPE", "PAYTM", "BHIM", "COD"])
          .default("RAZORPAY"),
        notes: z.string().optional(),
        giftWrap: z.boolean().default(false),
        giftMessage: z.string().optional(),
      })
      .parse(req.body);

    const order = await prisma.$transaction(async (tx) => {
      // 1. Resolve User ID (Authenticated or Guest User in DB)
      let targetUserId = req.user?.id;
      if (!targetUserId) {
        const guestEmail =
          body.guestCustomer?.email ||
          `customer_${Date.now()}@urhometaste.in`;
        const guestName =
          body.guestCustomer?.name || body.shippingAddress?.name || "Guest Customer";
        const guestPhone =
          body.guestCustomer?.phone || body.shippingAddress?.phone || null;

        let userRecord = await tx.user.findFirst({
          where: {
            OR: [
              { email: guestEmail },
              ...(guestPhone ? [{ phone: guestPhone }] : []),
            ],
          },
        });
        if (!userRecord) {
          userRecord = await tx.user.create({
            data: {
              email: guestEmail,
              name: guestName,
              phone: guestPhone,
              passwordHash: "$2b$10$guest.account.no.password.hash.uht",
              role: "CUSTOMER",
              referralCode: `GUEST-${Date.now().toString(36).toUpperCase()}`,
            },
          });
        }
        targetUserId = userRecord.id;
      }

      // 2. Resolve Shipping Address Snapshot
      let addressSnapshot: any;
      if (body.shippingAddress) {
        addressSnapshot = {
          fullName: body.shippingAddress.name,
          phone: body.shippingAddress.phone,
          line1: body.shippingAddress.line1,
          line2: body.shippingAddress.line2 || "",
          city: body.shippingAddress.city,
          state: body.shippingAddress.state,
          pincode: body.shippingAddress.pincode,
          landmark: "",
          country: body.shippingAddress.country || "India",
        };
      } else if (body.addressId) {
        const address = await tx.address.findFirst({
          where: { id: body.addressId, userId: targetUserId },
        });
        if (!address) throw new HttpError(404, "Address not found");
        addressSnapshot = {
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          landmark: address.landmark,
          country: "India",
        };
      } else {
        throw new HttpError(400, "Delivery shipping address is required");
      }

      // 3. Validate Variants & Stock
      const variants = await tx.productVariant.findMany({
        where: { id: { in: body.items.map((i) => i.variantId) } },
        include: { product: true },
      });

      for (const item of body.items) {
        const variant = variants.find((v) => v.id === item.variantId);
        if (!variant) throw new HttpError(422, "Product variant not found");
        if (!variant.isActive || !variant.product.isActive) {
          throw new HttpError(422, `${variant.product.name} is currently unavailable`);
        }
        if (variant.stock < item.quantity) {
          throw new HttpError(
            409,
            `${variant.product.name} (${variant.weight}): only ${variant.stock} available in stock`
          );
        }
      }

      // 4. Calculate Prices Server-Side
      const subtotal = body.items.reduce((sum, item) => {
        const variant = variants.find((v) => v.id === item.variantId)!;
        return sum + Number(variant.price) * item.quantity;
      }, 0);

      // 5. Coupon validation
      let coupon = null;
      let discount = 0;
      if (body.couponCode) {
        coupon = await tx.coupon.findUnique({
          where: { code: body.couponCode.toUpperCase() },
        });
        if (
          !coupon ||
          !coupon.isActive ||
          new Date() > coupon.endsAt ||
          new Date() < coupon.startsAt
        ) {
          throw new HttpError(400, "Invalid or expired coupon");
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          throw new HttpError(400, "Coupon usage limit reached");
        }
        if (subtotal < Number(coupon.minOrder)) {
          throw new HttpError(
            400,
            `Minimum order of ₹${coupon.minOrder} required for this coupon`
          );
        }

        discount = coupon.percentOff
          ? Math.min(
              Math.round((subtotal * coupon.percentOff) / 100),
              Number(coupon.maxDiscount ?? Infinity)
            )
          : Math.min(Number(coupon.amountOff ?? 0), subtotal);
      }

      // 6. Shipping & Totals
      const shippingConfig = await tx.shippingConfig.findFirst({
        where: { isActive: true },
      });
      const deliveryCharge =
        subtotal >= Number(shippingConfig?.freeShippingAbove ?? 999)
          ? 0
          : Number(shippingConfig?.flatRate ?? 60);
      const tax = Math.round((subtotal - discount) * 0.05);
      const giftWrapCharge = body.giftWrap ? 49 : 0;
      const total = Math.max(0, subtotal - discount + tax + deliveryCharge + giftWrapCharge);

      // 7. Deduct stock and reserve
      for (const item of body.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { decrement: item.quantity },
            reserved: { increment: item.quantity },
          },
        });
      }

      const isCod = body.paymentMethod === "COD";
      const initialStatus = isCod ? "CONFIRMED" : "PENDING_PAYMENT";
      const initialNote = isCod
        ? "Order placed successfully via Cash on Delivery"
        : "Order created, awaiting payment verification";

      const orderNumber = `UHT-${Date.now().toString(36).toUpperCase()}`;

      // 8. Create Order with Payment & Initial Timeline
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: targetUserId,
          addressSnapshot,
          status: initialStatus,
          subtotal,
          discount,
          tax,
          deliveryCharge,
          total,
          giftWrap: body.giftWrap,
          giftMessage: body.giftMessage,
          couponId: coupon?.id,
          estimatedDelivery: shippingConfig?.estimatedDays ?? "2-5 business days",
          items: {
            create: body.items.map((item) => {
              const variant = variants.find((v) => v.id === item.variantId)!;
              return {
                productId: item.productId,
                variantId: item.variantId,
                name: variant.product.name,
                weight: variant.weight,
                quantity: item.quantity,
                price: variant.price,
                total: Number(variant.price) * item.quantity,
              };
            }),
          },
          payment: {
            create: {
              method: body.paymentMethod,
              status: "CREATED",
              amount: total,
              transactionId: isCod ? `COD-${Date.now()}` : undefined,
            },
          },
          timeline: {
            create: {
              status: initialStatus,
              note: initialNote,
            },
          },
        },
        include: {
          items: {
            include: {
              product: { select: { name: true, slug: true, images: true } },
            },
          },
          payment: true,
          timeline: true,
        },
      });

      // 9. Coupon Usage Record
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
        await tx.couponUsage.create({
          data: {
            couponId: coupon.id,
            userId: targetUserId,
            orderId: newOrder.id,
          },
        });
      }

      return newOrder;
    });

    createNotification(order.userId, "ORDER_PLACED", {
      orderNumber: order.orderNumber,
    }).catch(() => {});

    res.status(201).json({
      order: {
        ...order,
        trackingUrl: getTrackingUrl(order.courier, order.trackingNumber),
      },
    });
  })
);

// ─── CANCEL ORDER ───
orderRouter.patch(
  "/:id/cancel",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);

    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findFirst({
        where: { id: req.params.id, userId: req.user!.id },
        include: { items: true, payment: true },
      });
      if (!existing) throw new HttpError(404, "Order not found");

      const cancellableStatuses = ["PENDING_PAYMENT", "CONFIRMED", "PROCESSING"];
      if (!cancellableStatuses.includes(existing.status)) {
        throw new HttpError(
          409,
          `Order cannot be cancelled at this stage (${existing.status.replace(/_/g, " ")})`
        );
      }

      for (const item of existing.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { increment: item.quantity },
            reserved: { decrement: item.quantity },
          },
        });
      }

      const updated = await tx.order.update({
        where: { id: existing.id },
        data: {
          status: "CANCELLED",
          cancellationReason: reason ?? "Cancelled by customer",
          cancelledAt: new Date(),
          timeline: {
            create: {
              status: "CANCELLED",
              note: reason ?? "Cancelled by customer",
            },
          },
        },
        include: {
          items: true,
          payment: true,
          timeline: { orderBy: { createdAt: "desc" } },
        },
      });

      if (existing.payment?.status === "CAPTURED") {
        await tx.payment.update({
          where: { orderId: existing.id },
          data: { refundStatus: "INITIATED" },
        });
        await tx.order.update({
          where: { id: existing.id },
          data: {
            status: "REFUND_INITIATED",
            timeline: {
              create: {
                status: "REFUND_INITIATED",
                note: "Refund initiated for cancelled order",
              },
            },
          },
        });
      }

      return updated;
    });

    createNotification(req.user!.id, "ORDER_CANCELLED", {
      orderNumber: order.orderNumber,
      refundNote:
        order.payment?.status === "CAPTURED"
          ? "Refund will be processed within 5-7 business days."
          : "",
    }).catch(() => {});

    res.json({
      order: {
        ...order,
        trackingUrl: getTrackingUrl(order.courier, order.trackingNumber),
      },
    });
  })
);

