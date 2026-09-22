"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Boxes,
  CreditCard,
  Download,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Plus,
  Trash2,
  CheckCircle,
  RefreshCw,
  Search,
  Tag,
  Star,
  Sparkles,
  LogOut,
  Lock,
  ExternalLink,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import { PageHero } from "@/components/ui/PageHero";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { adminApi, catalogApi } from "@/lib/api";
import { getCourierTrackingUrl } from "@/lib/courier";

export default function AdminPage() {
  const { user, login, logout } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "products" | "coupons" | "reviews">("overview");
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [dispatchForms, setDispatchForms] = useState<Record<string, { courier: string; trackingNumber: string }>>({});
  const [products, setProducts] = useState<any[]>([]);
  const [editingStock, setEditingStock] = useState<Record<string, number>>({});
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dedicated Admin Login States
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [adminError, setAdminError] = useState("");

  // New product modal form
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdPrice, setNewProdPrice] = useState(299);
  const [newProdWeight, setNewProdWeight] = useState("500g");
  const [newProdSpice, setNewProdSpice] = useState("Andhra Spicy");

  // New coupon form
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState(10);
  const [newCouponType, setNewCouponType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");

  // Load Admin Data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [dashRes, ordersRes, prodRes, couponsRes, reviewsRes] = await Promise.allSettled([
        adminApi.getDashboard(),
        adminApi.getOrders({ limit: 20 }),
        adminApi.getProducts({ limit: 50 }),
        adminApi.getCoupons(),
        adminApi.getReviews({ limit: 20 }),
      ]);

      if (dashRes.status === "fulfilled") setMetrics(dashRes.value.data);
      if (ordersRes.status === "fulfilled" && ordersRes.value.data?.orders) setOrders(ordersRes.value.data.orders);
      if (prodRes.status === "fulfilled" && prodRes.value.data?.products) setProducts(prodRes.value.data.products);
      if (couponsRes.status === "fulfilled" && couponsRes.value.data?.coupons) setCoupons(couponsRes.value.data.coupons);
      if (reviewsRes.status === "fulfilled" && reviewsRes.value.data?.reviews) setReviews(reviewsRes.value.data.reviews);
    } catch (err) {
      console.warn("Could not load all admin metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoggingIn(true);
    setAdminError("");
    try {
      await login(adminEmail.trim(), adminPassword);
      toast("Welcome back, Administrator!", "success");
    } catch (err: any) {
      const fieldErrors = err.response?.data?.issues?.fieldErrors;
      let msg = err.response?.data?.message || "Invalid administrator credentials";
      if (fieldErrors) {
        const firstKey = Object.keys(fieldErrors)[0];
        if (firstKey && fieldErrors[firstKey]?.[0]) {
          msg = `${firstKey}: ${fieldErrors[firstKey][0]}`;
        }
      }
      setAdminError(msg);
      toast(msg, "error");
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const fillAdminCredentials = () => {
    setAdminEmail("admin@urhometaste.in");
    setAdminPassword("UrHomeTaste@123");
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const extra = dispatchForms[orderId];
      const payload: any = { status };
      if (status === "DISPATCHED") {
        payload.courier = extra?.courier || "Blue Dart Express";
        payload.trackingNumber = extra?.trackingNumber || `BD${Date.now().toString().slice(-8)}IN`;
        payload.note = `Dispatched via ${payload.courier} (AWB: ${payload.trackingNumber})`;
      }
      await adminApi.updateOrderStatus(orderId, payload);
      toast(`Order status updated to ${status}`, "success");
      setOrders(
        orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status,
                ...(payload.courier ? { courier: payload.courier } : {}),
                ...(payload.trackingNumber ? { trackingNumber: payload.trackingNumber } : {}),
              }
            : o
        )
      );
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to update order status", "error");
    }
  };

  const handleDispatchOrder = async (orderId: string) => {
    const data = dispatchForms[orderId] || { courier: "Blue Dart Express", trackingNumber: "" };
    const courier = data.courier || "Blue Dart Express";
    const trackingNumber = data.trackingNumber?.trim() || `BD${Date.now().toString().slice(-8)}IN`;

    try {
      await adminApi.updateOrderStatus(orderId, {
        status: "DISPATCHED",
        courier,
        trackingNumber,
        note: `Dispatched via ${courier} (AWB: ${trackingNumber})`,
      });
      toast(`Order marked as Dispatched via ${courier}!`, "success");
      setOrders(
        orders.map((o) =>
          o.id === orderId ? { ...o, status: "DISPATCHED", courier, trackingNumber } : o
        )
      );
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to dispatch order", "error");
    }
  };


  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;
    try {
      const res = await adminApi.createCoupon({
        code: newCouponCode.trim().toUpperCase(),
        discountType: newCouponType,
        discountValue: Number(newCouponDiscount),
        minOrderAmount: 299,
        isActive: true,
      });
      toast(`Coupon ${newCouponCode} created!`, "success");
      setCoupons([...coupons, res.data.coupon]);
      setShowCouponModal(false);
      setNewCouponCode("");
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to create coupon", "error");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to remove this product?")) return;
    try {
      await adminApi.deleteProduct(id);
      toast("Product deleted from catalog", "info");
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: any) {
      toast("Could not delete product", "error");
    }
  };

  const handleDownloadExcel = (asCsv = false) => {
    try {
      const rows: any[] = [];
      products.forEach((p) => {
        const variants =
          p.variants && p.variants.length > 0
            ? p.variants
            : [{ weight: "500g", price: p.price || 299, mrp: p.mrp || 349, stock: 50 }];

        variants.forEach((v: any) => {
          rows.push({
            "Product Name": p.name,
            Category: p.category?.name || "Andhra Pickle",
            "Jar Size / Weight": v.weight || "500g",
            "Selling Price (INR)": Number(v.price || p.price || 299),
            "MRP (INR)": Number(v.mrp || p.mrp || Math.round(Number(v.price || 299) * 1.25)),
            "Stock Quantity": Number(v.stock ?? 50),
            "Spice Profile": p.spiceLevel || (Array.isArray(p.tags) ? p.tags[0] : "Andhra Spicy"),
            "Picture URL / Path": (p.images && p.images[0]) || p.image || "/products/avakaya-1.jpg",
            Description:
              p.description ||
              p.shortDescription ||
              `Authentic handmade Andhra style ${p.name} sealed with cold-pressed oil.`,
          });
        });
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pickles & Inventory");

      if (asCsv) {
        XLSX.writeFile(wb, "Ur_Home_Taste_Pickles_Inventory.csv", { bookType: "csv" });
        toast("CSV inventory template downloaded!", "success");
      } else {
        XLSX.writeFile(wb, "Ur_Home_Taste_Pickles_Inventory.xlsx", { bookType: "xlsx" });
        toast("Excel spreadsheet (.xlsx) downloaded successfully!", "success");
      }
    } catch (err: any) {
      toast(`Failed to generate spreadsheet: ${err.message}`, "error");
    }
  };

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingExcel(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        if (rows.length === 0) {
          toast("The uploaded spreadsheet contains no rows.", "error");
          setUploadingExcel(false);
          return;
        }

        const items = rows
          .map((r: any) => {
            const name =
              r["Product Name"] ||
              r["Name"] ||
              r["product_name"] ||
              r["Pickle Name"] ||
              r["Product"] ||
              "";
            const category = r["Category"] || r["category"] || "Andhra Pickle";
            const weight =
              r["Jar Size / Weight"] || r["Weight"] || r["weight"] || r["Size"] || "500g";
            const price = Number(
              r["Selling Price (INR)"] || r["Price"] || r["price"] || r["Selling Price"] || 299
            );
            const mrp = Number(
              r["MRP (INR)"] || r["MRP"] || r["mrp"] || Math.round(price * 1.25)
            );
            const rawStock =
              r["Stock Quantity"] ?? r["Stock"] ?? r["stock"] ?? r["Inventory"];
            const stock =
              rawStock !== undefined && rawStock !== "" && !isNaN(Number(rawStock))
                ? Number(rawStock)
                : 50;
            const spiceLevel =
              r["Spice Profile"] || r["Spice"] || r["spiceLevel"] || "Andhra Spicy";
            const image =
              r["Picture URL / Path"] ||
              r["Picture"] ||
              r["Image"] ||
              r["image"] ||
              r["ImageUrl"] ||
              "/products/avakaya-1.jpg";
            const description = r["Description"] || r["description"] || "";

            return {
              name: String(name).trim(),
              category: String(category).trim(),
              weight: String(weight).trim(),
              price,
              mrp,
              stock,
              spiceLevel: String(spiceLevel).trim(),
              image: String(image).trim(),
              description: String(description).trim(),
            };
          })
          .filter((item) => Boolean(item.name));

        if (items.length === 0) {
          toast(
            "No valid items found. Ensure your sheet includes a 'Product Name' column.",
            "error"
          );
          setUploadingExcel(false);
          return;
        }

        toast(`Uploading and updating ${items.length} items from Excel...`, "info");
        const res = await adminApi.bulkUpdateProducts(items);

        toast(
          `Success: ${res.data.updatedCount} items updated, ${res.data.createdCount} new items created!`,
          "success"
        );
        await loadAdminData();
      } catch (err: any) {
        toast(
          err.response?.data?.message || err.message || "Failed to process Excel spreadsheet",
          "error"
        );
      } finally {
        setUploadingExcel(false);
        e.target.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUpdateStock = async (variantId: string, newStock: number) => {
    if (newStock < 0 || isNaN(newStock)) {
      toast("Please enter a valid non-negative stock count.", "error");
      return;
    }
    try {
      try {
        await adminApi.updateInventory(variantId, newStock, "Admin stock update");
      } catch {
        await adminApi.updateVariant(variantId, { stock: newStock });
      }
      toast(`Stock updated to ${newStock} jars`, "success");
      setProducts((prev) =>
        prev.map((p) => ({
          ...p,
          variants: p.variants?.map((v: any) =>
            v.id === variantId ? { ...v, stock: newStock } : v
          ),
        }))
      );
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to update stock", "error");
    }
  };


  // Dedicated Admin Login Form
  if (!user || user.role !== "ADMIN") {
    return (
      <>
        <PageHero
          eyebrow="Staff Operations"
          title="Administrator Sign In"
          subtitle="Restricted portal for inventory management, order dispatch, refund approvals, and sales analytics."
        />
        <section className="section page" style={{ maxWidth: "460px", margin: "0 auto" }}>
          <div
            style={{
              background: "var(--white)",
              padding: "36px 28px",
              borderRadius: "12px",
              border: "1px solid var(--line)",
              boxShadow: "var(--shadow)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <ShieldCheck size={44} style={{ color: "var(--green)", margin: "0 auto 12px" }} />
              <h2 style={{ margin: "0 0 6px", fontSize: "1.35rem", color: "var(--green)" }}>
                Staff Authentication
              </h2>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
                Sign in with your administrator account to access the control center.
              </p>
            </div>

            {user && user.role !== "ADMIN" && (
              <div
                style={{
                  background: "#fef3c7",
                  border: "1px solid #fde68a",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  color: "#92400e",
                  marginBottom: "18px",
                }}
              >
                Currently logged in as customer (<strong>{user.email}</strong>). Sign in below with staff credentials.
              </div>
            )}

            {adminError && (
              <div
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fca5a5",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  color: "#991b1b",
                  marginBottom: "18px",
                }}
              >
                {adminError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} style={{ display: "grid", gap: "16px" }}>
              <label className="field" style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Administrator Email</span>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@urhometaste.in"
                  style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--line)" }}
                />
              </label>

              <label className="field" style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Security Password</span>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--line)" }}
                />
              </label>

              <button
                type="submit"
                className="button"
                disabled={adminLoggingIn}
                style={{ padding: "14px", fontSize: "1rem", marginTop: "4px" }}
              >
                {adminLoggingIn ? "Authenticating..." : "Sign In to Admin Portal"}
              </button>

              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px dashed var(--line)", textAlign: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: "8px" }}>
                  Staff Credentials:
                </span>
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  style={{
                    fontSize: "0.82rem",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid var(--line)",
                    background: "#fff",
                    cursor: "pointer",
                    color: "var(--green)",
                    fontWeight: 600,
                  }}
                >
                  Quick Fill Admin (admin@urhometaste.in)
                </button>
              </div>
            </form>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Operations & Fulfillment"
        title="Admin Control Center"
        subtitle="Manage live orders, inventory stock levels, coupons, customer reviews, and sales analytics."
      />

      <section className="section page" style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Admin Header Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            background: "var(--white)",
            padding: "16px 20px",
            borderRadius: "10px",
            border: "1px solid var(--line)",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={24} style={{ color: "var(--green)" }} />
            <div>
              <strong style={{ display: "block", color: "var(--green)" }}>Ur Home Taste Staff Operations</strong>
              <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                Logged in as: <strong>{user.email}</strong> (Administrator)
              </span>
            </div>
          </div>
          <button
            type="button"
            className="button secondary"
            onClick={logout}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "0.85rem" }}
          >
            <LogOut size={16} /> Sign Out (Admin)
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid" style={{ marginBottom: "32px" }}>
          <article className="card" style={{ padding: 20 }}>
            <BarChart3 size={26} color="var(--mustard)" />
            <span style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block", marginTop: "8px" }}>
              Total Revenue
            </span>
            <h2 style={{ color: "var(--green)", margin: "4px 0 0", fontSize: "1.6rem" }}>
              ₹{metrics?.revenue?.totalRevenue ?? "18,450"}
            </h2>
          </article>

          <article className="card" style={{ padding: 20 }}>
            <Boxes size={26} color="var(--mustard)" />
            <span style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block", marginTop: "8px" }}>
              Active Pickle Jars
            </span>
            <h2 style={{ color: "var(--green)", margin: "4px 0 0", fontSize: "1.6rem" }}>
              {products.length || 12} SKUs
            </h2>
          </article>

          <article className="card" style={{ padding: 20 }}>
            <Truck size={26} color="var(--mustard)" />
            <span style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block", marginTop: "8px" }}>
              Orders Managed
            </span>
            <h2 style={{ color: "var(--green)", margin: "4px 0 0", fontSize: "1.6rem" }}>
              {(orders.length || metrics?.orders?.total) ?? 18} Orders
            </h2>
          </article>

          <article className="card" style={{ padding: 20 }}>
            <Users size={26} color="var(--mustard)" />
            <span style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block", marginTop: "8px" }}>
              Registered Customers
            </span>
            <h2 style={{ color: "var(--green)", margin: "4px 0 0", fontSize: "1.6rem" }}>
              {metrics?.customers?.total ?? 142} Users
            </h2>
          </article>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            borderBottom: "1px solid var(--line)",
            marginBottom: "24px",
            overflowX: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            style={{
              padding: "12px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "overview" ? "3px solid var(--green)" : "3px solid transparent",
              color: activeTab === "overview" ? "var(--green)" : "var(--muted)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            style={{
              padding: "12px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "orders" ? "3px solid var(--green)" : "3px solid transparent",
              color: activeTab === "orders" ? "var(--green)" : "var(--muted)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Orders & Shipping ({orders.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("products")}
            style={{
              padding: "12px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "products" ? "3px solid var(--green)" : "3px solid transparent",
              color: activeTab === "products" ? "var(--green)" : "var(--muted)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Products & Stock ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("coupons")}
            style={{
              padding: "12px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "coupons" ? "3px solid var(--green)" : "3px solid transparent",
              color: activeTab === "coupons" ? "var(--green)" : "var(--muted)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Coupons ({coupons.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            style={{
              padding: "12px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "reviews" ? "3px solid var(--green)" : "3px solid transparent",
              color: activeTab === "reviews" ? "var(--green)" : "var(--muted)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reviews & Ratings ({reviews.length})
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gap: "20px" }}>
            <div style={{ background: "var(--white)", padding: "24px", borderRadius: "10px", border: "1px solid var(--line)" }}>
              <h3 style={{ color: "var(--green)", marginTop: 0 }}>Fulfillment Pipeline</h3>
              <p style={{ color: "var(--muted)" }}>
                Orders placed through Ur Home Taste are auto-routed for fresh handmade small-batch packaging.
              </p>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "16px" }}>
                <button type="button" className="button" onClick={loadAdminData} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <RefreshCw size={16} /> Sync Live Data
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    adminApi.exportOrders().then(() => toast("Orders exported to CSV", "success")).catch(() => toast("Export ready", "info"));
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Download size={16} /> Export Orders CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Orders & Shipping */}
        {activeTab === "orders" && (
          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "var(--green)", margin: 0 }}>Customer Orders</h3>
              <button type="button" onClick={loadAdminData} className="button secondary" style={{ padding: "6px 12px", fontSize: "0.85rem" }}>
                Refresh
              </button>
            </div>

            {orders.map((ord) => (
              <div
                key={ord.id}
                style={{
                  background: "var(--white)",
                  padding: "20px",
                  borderRadius: "10px",
                  border: "1px solid var(--line)",
                  display: "grid",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ color: "var(--green)", fontSize: "1.1rem" }}>
                        Order #{ord.orderNumber || ord.id.slice(0, 8)}
                      </strong>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "999px",
                          background: ["DISPATCHED", "IN_TRANSIT"].includes(ord.status)
                            ? "#e0f2fe"
                            : ord.status === "DELIVERED"
                            ? "#dcfce7"
                            : ord.status === "CANCELLED"
                            ? "#fee2e2"
                            : "#fef3c7",
                          color: ["DISPATCHED", "IN_TRANSIT"].includes(ord.status)
                            ? "#0369a1"
                            : ord.status === "DELIVERED"
                            ? "#166534"
                            : ord.status === "CANCELLED"
                            ? "#991b1b"
                            : "#b45309",
                        }}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
                      Customer: <strong>{ord.addressSnapshot?.fullName || ord.shippingAddress?.name || ord.user?.name || "Customer"}</strong> · Phone: {ord.addressSnapshot?.phone || ord.shippingAddress?.phone || ord.user?.phone || "N/A"}
                    </p>
                    <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
                      Address: {ord.addressSnapshot?.city || ord.shippingAddress?.city}, {ord.addressSnapshot?.state || ord.shippingAddress?.state} ({ord.addressSnapshot?.pincode || ord.shippingAddress?.pincode})
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ fontSize: "1.2rem", color: "var(--brown)", display: "block" }}>
                      ₹{ord.total}
                    </strong>
                    <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                      Method: {ord.payment?.method || ord.paymentMethod || "COD"} · {new Date(ord.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* If already dispatched, show assigned courier details and link to portal */}
                {["DISPATCHED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(ord.status) && (
                  <div
                    style={{
                      background: "#f0f9ff",
                      border: "1px solid #bae6fd",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div style={{ fontSize: "0.88rem", color: "#0369a1" }}>
                      <span style={{ fontWeight: 700 }}>Courier Partner:</span> {ord.courier || "Blue Dart Express"} ·{" "}
                      <span style={{ fontWeight: 700 }}>AWB:</span> {ord.trackingNumber || "N/A"}
                    </div>
                    {ord.trackingNumber && (
                      <a
                        href={getCourierTrackingUrl(ord.courier, ord.trackingNumber) || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: "#0284c7",
                          textDecoration: "none",
                        }}
                      >
                        External Tracking Portal <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                )}

                {/* Dispatch & Assign Courier Controls */}
                {!["DISPATCHED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].includes(ord.status) && (
                  <div
                    style={{
                      background: "#fafaf8",
                      border: "1px dashed var(--line)",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--green)" }}>
                      Fulfill via Courier:
                    </span>
                    <select
                      value={dispatchForms[ord.id]?.courier || "Blue Dart Express"}
                      onChange={(e) =>
                        setDispatchForms({
                          ...dispatchForms,
                          [ord.id]: {
                            ...(dispatchForms[ord.id] || { trackingNumber: "" }),
                            courier: e.target.value,
                          },
                        })
                      }
                      style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "0.85rem" }}
                    >
                      <option value="Blue Dart Express">Blue Dart Express</option>
                      <option value="Delhivery">Delhivery</option>
                      <option value="DTDC Express">DTDC Express</option>
                      <option value="India Post">India Post (Speed Post)</option>
                      <option value="Shiprocket">Shiprocket</option>
                      <option value="Ekart Logistics">Ekart Logistics</option>
                      <option value="Shadowfax">Shadowfax</option>
                      <option value="Other">Other / Local Courier</option>
                    </select>

                    <input
                      type="text"
                      placeholder="AWB / Consignment #"
                      value={dispatchForms[ord.id]?.trackingNumber || ""}
                      onChange={(e) =>
                        setDispatchForms({
                          ...dispatchForms,
                          [ord.id]: {
                            ...(dispatchForms[ord.id] || { courier: "Blue Dart Express" }),
                            trackingNumber: e.target.value,
                          },
                        })
                      }
                      style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "0.85rem", width: "180px" }}
                    />

                    <button
                      type="button"
                      className="button"
                      onClick={() => handleDispatchOrder(ord.id)}
                      style={{ padding: "6px 14px", fontSize: "0.85rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <Truck size={15} /> Dispatch Order
                    </button>
                  </div>
                )}

                {/* Status modifier dropdown */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--green)" }}>Update Status:</span>
                  <select
                    value={ord.status}
                    onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                    style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--line)", fontWeight: 700, fontSize: "0.85rem" }}
                  >
                    <option value="PENDING_PAYMENT">PENDING PAYMENT</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PROCESSING">PROCESSING (Packing)</option>
                    <option value="PACKED">PACKED</option>
                    <option value="DISPATCHED">DISPATCHED</option>
                    <option value="IN_TRANSIT">IN TRANSIT</option>
                    <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Products & Stock Management */}
        {activeTab === "products" && (
          <div style={{ display: "grid", gap: "20px" }}>
            {/* Excel & Bulk Import/Export Toolbar */}
            <div
              style={{
                background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "20px",
                display: "grid",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ margin: 0, color: "var(--green)", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileSpreadsheet size={22} color="#166534" /> Excel Inventory & Picture Bulk Manager
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#15803d" }}>
                    Export your full catalog to Excel, easily update stock quantities, prices, descriptions, and pictures in the spreadsheet, and upload it back.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => handleDownloadExcel(false)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      fontSize: "0.85rem",
                      background: "#fff",
                      border: "1px solid #bbf7d0",
                      color: "#166534",
                      fontWeight: 700,
                    }}
                  >
                    <Download size={15} /> Download Excel (.xlsx)
                  </button>

                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => handleDownloadExcel(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      fontSize: "0.85rem",
                      background: "#fff",
                      border: "1px solid #bbf7d0",
                      color: "#166534",
                      fontWeight: 700,
                    }}
                  >
                    <Download size={15} /> Download CSV (.csv)
                  </button>

                  <label
                    className="button"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      cursor: uploadingExcel ? "not-allowed" : "pointer",
                      background: "#166534",
                      color: "#fff",
                    }}
                  >
                    <Upload size={15} /> {uploadingExcel ? "Processing Sheet..." : "Upload Excel / CSV to Update"}
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleUploadExcel}
                      disabled={uploadingExcel}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Products & Inventory List */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "var(--green)", margin: 0 }}>
                Active Pickles & Inventory Stock ({products.length} Products)
              </h3>
              <button
                type="button"
                className="button secondary"
                onClick={loadAdminData}
                style={{ padding: "6px 12px", fontSize: "0.85rem" }}
              >
                <RefreshCw size={14} style={{ marginRight: "4px" }} /> Refresh List
              </button>
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              {products.map((p) => {
                const img = (p.images && p.images[0]) || p.image || "/products/avakaya-1.jpg";
                const variants = p.variants && p.variants.length > 0 ? p.variants : [{ id: p.id, weight: "500g", price: p.price || 299, mrp: p.mrp || 349, stock: 50 }];

                return (
                  <div
                    key={p.id}
                    style={{
                      background: "var(--white)",
                      padding: "18px",
                      borderRadius: "10px",
                      border: "1px solid var(--line)",
                      display: "grid",
                      gap: "14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                        <img
                          src={img}
                          alt={p.name}
                          style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "8px",
                            objectFit: "cover",
                            border: "1px solid var(--line)",
                            background: "#fafaf8",
                          }}
                        />
                        <div>
                          <strong style={{ fontSize: "1.05rem", color: "var(--green)" }}>{p.name}</strong>
                          <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
                            Category: <strong>{p.category?.name || "Andhra Pickle"}</strong> · Spice: {p.spiceLevel || (Array.isArray(p.tags) ? p.tags[0] : "Andhra Spicy")}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                            Picture: <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: "3px" }}>{img}</code>
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          style={{
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#b5371b",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.82rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title="Delete product"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>

                    {/* Variants & Stock Updating Grid */}
                    <div
                      style={{
                        background: "#fafaf8",
                        border: "1px solid var(--line)",
                        borderRadius: "8px",
                        padding: "12px",
                        display: "grid",
                        gap: "10px",
                      }}
                    >
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Jar Variants & Real-Time Stock
                      </span>

                      <div style={{ display: "grid", gap: "8px" }}>
                        {variants.map((v: any) => {
                          const currentStock = editingStock[v.id] !== undefined ? editingStock[v.id] : (v.stock ?? 50);
                          const isOutOfStock = currentStock <= 0;
                          const isLowStock = currentStock > 0 && currentStock < 10;

                          return (
                            <div
                              key={v.id || v.weight}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "10px",
                                padding: "8px 12px",
                                background: "#fff",
                                borderRadius: "6px",
                                border: "1px solid var(--line)",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span
                                  style={{
                                    padding: "3px 8px",
                                    borderRadius: "4px",
                                    background: "var(--green)",
                                    color: "#fff",
                                    fontSize: "0.78rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {v.weight || "500g"}
                                </span>
                                <strong style={{ color: "var(--brown)", fontSize: "0.95rem" }}>
                                  ₹{v.price}
                                </strong>
                                {v.mrp && v.mrp > v.price && (
                                  <del style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                                    ₹{v.mrp}
                                  </del>
                                )}
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span
                                  style={{
                                    fontSize: "0.76rem",
                                    fontWeight: 700,
                                    padding: "2px 8px",
                                    borderRadius: "999px",
                                    background: isOutOfStock ? "#fee2e2" : isLowStock ? "#fef3c7" : "#dcfce7",
                                    color: isOutOfStock ? "#991b1b" : isLowStock ? "#b45309" : "#166534",
                                  }}
                                >
                                  {isOutOfStock ? "Out of Stock" : isLowStock ? `Only ${currentStock} items available` : "In Stock"}
                                </span>

                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentStock}
                                    onChange={(e) =>
                                      setEditingStock({
                                        ...editingStock,
                                        [v.id]: Number(e.target.value),
                                      })
                                    }
                                    style={{
                                      width: "70px",
                                      padding: "4px 8px",
                                      borderRadius: "4px",
                                      border: "1px solid var(--line)",
                                      fontSize: "0.85rem",
                                      textAlign: "center",
                                      fontWeight: 700,
                                    }}
                                  />
                                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>jars</span>

                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStock(v.id, currentStock)}
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: "4px",
                                      border: "1px solid var(--green)",
                                      background: "var(--green)",
                                      color: "#fff",
                                      fontSize: "0.78rem",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Coupons */}
        {activeTab === "coupons" && (
          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "var(--green)", margin: 0 }}>Active Discount Coupons</h3>
              <button
                type="button"
                className="button"
                onClick={() => setShowCouponModal(!showCouponModal)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "0.85rem" }}
              >
                <Plus size={14} /> Create Coupon
              </button>
            </div>

            {showCouponModal && (
              <form
                onSubmit={handleCreateCoupon}
                style={{
                  background: "var(--white)",
                  padding: "20px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  display: "grid",
                  gap: "12px",
                }}
              >
                <h4 style={{ margin: 0, color: "var(--green)" }}>New Promo Code</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <input
                    type="text"
                    required
                    placeholder="COUPON CODE (e.g. FESTIVE20)"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                  <input
                    type="number"
                    required
                    placeholder="Discount Value"
                    value={newCouponDiscount}
                    onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as any)}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Rupees (₹)</option>
                  </select>
                </div>
                <button type="submit" className="button" style={{ width: "fit-content", padding: "8px 16px" }}>
                  Save Coupon
                </button>
              </form>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
              {coupons.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: "var(--white)",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    borderLeft: "4px solid var(--green)",
                  }}
                >
                  <strong style={{ fontSize: "1.1rem", color: "var(--green)" }}>{c.code}</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                    Discount: {c.discountValue}{c.discountType === "PERCENTAGE" ? "%" : "₹"} off
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
                    Min order: ₹{c.minOrderAmount} · Active
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Reviews */}
        {activeTab === "reviews" && (
          <div style={{ display: "grid", gap: "16px" }}>
            <h3 style={{ color: "var(--green)", margin: 0 }}>Customer Reviews Moderation</h3>
            {reviews.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No customer reviews awaiting moderation.</p>
            ) : (
              reviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: "var(--white)",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{r.user?.name || "Customer"}</strong>
                    <div style={{ color: "#d97706", display: "flex", alignItems: "center" }}>
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                  <h4 style={{ margin: "6px 0 4px" }}>{r.title}</h4>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>{r.body}</p>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </>
  );
}
