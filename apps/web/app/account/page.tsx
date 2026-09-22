"use client";

import { useEffect, useState } from "react";
import {
  UserRound,
  MapPinned,
  Heart,
  Receipt,
  LogOut,
  Plus,
  Trash2,
  CheckCircle,
  Truck,
  Sparkles,
  Shield,
  Key,
} from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/components/ui/Toast";
import { orderApi, userApi } from "@/lib/api";
import { ProductCard } from "@/components/product/ProductCard";

export default function AccountPage() {
  const { user, loading: authLoading, login, signup, logout } = useAuth();
  const { addItem } = useCart();
  const { items: wishlistItems, removeFromWishlist } = useWishlist();
  const { toast } = useToast();

  // Auth form states
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Dashboard states
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "wishlist" | "profile">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("Andhra Pradesh");
  const [addrPincode, setAddrPincode] = useState("");

  // Profile form
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfilePhone(user.phone || "");
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setLoadingOrders(true);
    try {
      const [ordersRes, addrRes] = await Promise.allSettled([
        orderApi.list(),
        userApi.getAddresses(),
      ]);

      if (ordersRes.status === "fulfilled" && ordersRes.value.data.orders) {
        setOrders(ordersRes.value.data.orders);
      }
      if (addrRes.status === "fulfilled" && Array.isArray(addrRes.value)) {
        setAddresses(addrRes.value);
      }
    } catch (err) {
      console.warn("Could not load account details", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    try {
      await login(email, password);
      toast("Welcome back! You are now logged in.", "success");
    } catch (err: any) {
      const fieldErrors = err.response?.data?.issues?.fieldErrors;
      let errorMsg = err.response?.data?.message;
      if (fieldErrors) {
        const firstKey = Object.keys(fieldErrors)[0];
        if (firstKey && fieldErrors[firstKey]?.[0]) {
          errorMsg = `${firstKey}: ${fieldErrors[firstKey][0]}`;
        }
      }
      toast(errorMsg || "Invalid email or password", "error");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    try {
      await signup({ name, email, phone, password });
      toast("Account created successfully! Welcome to Ur Home Taste.", "success");
    } catch (err: any) {
      const fieldErrors = err.response?.data?.issues?.fieldErrors;
      let errorMsg = err.response?.data?.message;
      if (fieldErrors) {
        const firstKey = Object.keys(fieldErrors)[0];
        if (firstKey && fieldErrors[firstKey]?.[0]) {
          errorMsg = `${firstKey}: ${fieldErrors[firstKey][0]}`;
        }
      }
      toast(errorMsg || "Registration failed. Try a different email.", "error");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const fillCustomerDemo = () => {
    setEmail("customer@test.com");
    setPassword("Customer@123");
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.createAddress({
        fullName: addrName || user?.name || "Home",
        phone: addrPhone || user?.phone || "9876543210",
        line1: addrLine1,
        city: addrCity,
        state: addrState,
        pincode: addrPincode,
        isDefault: addresses.length === 0,
      });
      toast("Address saved to address book.", "success");
      setShowAddressForm(false);
      setAddrLine1("");
      setAddrCity("");
      setAddrPincode("");
      loadUserData();
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to save address", "error");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await userApi.deleteAddress(id);
      toast("Address removed", "info");
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch (err) {
      toast("Could not delete address", "error");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.updateProfile({ name: profileName, phone: profilePhone });
      toast("Profile updated successfully", "success");
    } catch (err) {
      toast("Failed to update profile", "error");
    }
  };

  // 1. Not Logged In View
  if (!user) {
    return (
      <>
        <PageHero
          eyebrow="Authentic Andhra Kitchen"
          title="Sign In to Ur Home Taste"
          subtitle="Access your saved delivery addresses, track your pickle jars, and manage your wishlist."
        />

        <section className="section page" style={{ maxWidth: "520px", margin: "0 auto" }}>
          <div
            style={{
              background: "var(--white)",
              borderRadius: "12px",
              padding: "32px",
              border: "1px solid var(--line)",
              boxShadow: "var(--shadow)",
            }}
          >
            {/* Tabs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                background: "rgba(24,63,44,0.06)",
                padding: "4px",
                borderRadius: "8px",
                marginBottom: "24px",
              }}
            >
              <button
                type="button"
                onClick={() => setAuthTab("login")}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: authTab === "login" ? "var(--white)" : "transparent",
                  color: authTab === "login" ? "var(--green)" : "var(--muted)",
                  boxShadow: authTab === "login" ? "var(--shadow)" : "none",
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthTab("signup")}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: authTab === "signup" ? "var(--white)" : "transparent",
                  color: authTab === "signup" ? "var(--green)" : "var(--muted)",
                  boxShadow: authTab === "signup" ? "var(--shadow)" : "none",
                }}
              >
                Create Account
              </button>
            </div>

            {/* Login Form */}
            {authTab === "login" ? (
              <form onSubmit={handleLogin} style={{ display: "grid", gap: "16px" }}>
                <label className="field" style={{ display: "grid", gap: "6px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Email Address</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@urhometaste.com"
                    style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                </label>

                <label className="field" style={{ display: "grid", gap: "6px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Password</span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                </label>

                <button type="submit" className="button" disabled={authSubmitting} style={{ padding: "14px", marginTop: "8px" }}>
                  {authSubmitting ? "Authenticating..." : "Sign In to Account"}
                </button>

                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px dashed var(--line)", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={fillCustomerDemo}
                    style={{ fontSize: "0.82rem", padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", color: "var(--green)", fontWeight: 600 }}
                  >
                    Quick Fill Test Customer (customer@test.com)
                  </button>
                </div>
              </form>
            ) : (
              /* Signup Form */
              <form onSubmit={handleSignup} style={{ display: "grid", gap: "14px" }}>
                <label className="field" style={{ display: "grid", gap: "4px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Full Name *</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sita Ramaraju"
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                </label>

                <label className="field" style={{ display: "grid", gap: "4px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Email Address *</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sita@example.com"
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                </label>

                <label className="field" style={{ display: "grid", gap: "4px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Phone Number (for courier SMS)</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                </label>

                <label className="field" style={{ display: "grid", gap: "4px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Password (min. 8 characters) *</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                </label>

                <button type="submit" className="button" disabled={authSubmitting} style={{ padding: "12px", marginTop: "6px" }}>
                  {authSubmitting ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            )}
          </div>
        </section>
      </>
    );
  }

  // 2. Logged In Dashboard View
  return (
    <>
      <PageHero
        eyebrow="Customer Dashboard"
        title={`Welcome, ${user.name}`}
        subtitle="Manage your Andhra pickle subscriptions, order history, delivery addresses, and personal profile."
      />

      <section className="section page" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Top bar with user overview & Admin link if applicable */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            background: "var(--white)",
            padding: "20px 24px",
            borderRadius: "12px",
            border: "1px solid var(--line)",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "999px",
                background: "var(--green)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: "1.2rem",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--green)" }}>{user.name}</h2>
              <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
                {user.email} · Role: <strong>{user.role}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              className="button secondary"
              onClick={logout}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Tab Controls */}
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
            onClick={() => setActiveTab("orders")}
            style={{
              padding: "12px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "orders" ? "3px solid var(--green)" : "3px solid transparent",
              color: activeTab === "orders" ? "var(--green)" : "var(--muted)",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Receipt size={18} /> My Orders ({orders.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("addresses")}
            style={{
              padding: "12px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "addresses" ? "3px solid var(--green)" : "3px solid transparent",
              color: activeTab === "addresses" ? "var(--green)" : "var(--muted)",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <MapPinned size={18} /> Saved Addresses ({addresses.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("wishlist")}
            style={{
              padding: "12px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "wishlist" ? "3px solid var(--green)" : "3px solid transparent",
              color: activeTab === "wishlist" ? "var(--green)" : "var(--muted)",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Heart size={18} /> Wishlist ({wishlistItems.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            style={{
              padding: "12px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "profile" ? "3px solid var(--green)" : "3px solid transparent",
              color: activeTab === "profile" ? "var(--green)" : "var(--muted)",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <UserRound size={18} /> Profile Settings
          </button>
        </div>

        {/* Tab 1: Orders */}
        {activeTab === "orders" && (
          <div>
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--white)", borderRadius: "10px", border: "1px dashed var(--line)" }}>
                <Receipt size={40} style={{ color: "var(--muted)", margin: "0 auto 12px" }} />
                <h3>No Orders Placed Yet</h3>
                <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
                  Your hand-cured Andhra pickle jars will appear here once you make your first order.
                </p>
                <Link href="/shop" className="button">
                  Browse Authentic Pickles
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    style={{
                      background: "var(--white)",
                      padding: "20px",
                      borderRadius: "10px",
                      border: "1px solid var(--line)",
                      boxShadow: "var(--shadow)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--line)", paddingBottom: "12px" }}>
                      <div>
                        <strong style={{ color: "var(--green)", fontSize: "1.05rem" }}>
                          Order #{ord.orderNumber || ord.id.slice(0, 8)}
                        </strong>
                        <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
                          Date: {new Date(ord.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} · Total: <strong>₹{ord.total}</strong>
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "999px",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            background: ord.status === "DELIVERED" ? "#dcfce7" : "#fef3c7",
                            color: ord.status === "DELIVERED" ? "#166534" : "#92400e",
                          }}
                        >
                          {ord.status}
                        </span>
                        <Link
                          href={`/track-order?orderId=${ord.id}`}
                          className="button secondary"
                          style={{ padding: "6px 12px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <Truck size={14} /> Track
                        </Link>
                      </div>
                    </div>

                    <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
                      {ord.items?.map((item: any) => (
                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                          <span>
                            {item.productName || item.product?.name} ({item.variantWeight || item.variant?.weight}) × {item.quantity}
                          </span>
                          <strong>₹{item.totalPrice || item.unitPrice * item.quantity}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Addresses */}
        {activeTab === "addresses" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ color: "var(--green)", margin: 0 }}>Saved Delivery Locations</h3>
              <button
                type="button"
                className="button secondary"
                onClick={() => setShowAddressForm(!showAddressForm)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Plus size={16} /> {showAddressForm ? "Cancel" : "Add New Address"}
              </button>
            </div>

            {showAddressForm && (
              <form
                onSubmit={handleSaveAddress}
                style={{
                  background: "var(--white)",
                  padding: "24px",
                  borderRadius: "10px",
                  border: "1px solid var(--line)",
                  marginBottom: "20px",
                  display: "grid",
                  gap: "12px",
                }}
              >
                <h4 style={{ margin: 0, color: "var(--green)" }}>New Address</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <input
                    type="text"
                    placeholder="Recipient Name"
                    value={addrName}
                    onChange={(e) => setAddrName(e.target.value)}
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                  <input
                    type="tel"
                    placeholder="Contact Phone"
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Street / Flat / Door Number"
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Pincode"
                    value={addrPincode}
                    onChange={(e) => setAddrPincode(e.target.value)}
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                </div>
                <button type="submit" className="button" style={{ width: "fit-content", padding: "10px 20px" }}>
                  Save Address
                </button>
              </form>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {addresses.map((a) => (
                <div
                  key={a.id}
                  style={{
                    background: "var(--white)",
                    padding: "18px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    position: "relative",
                  }}
                >
                  <strong style={{ display: "block", color: "var(--green)" }}>{a.fullName || a.name || "Home"}</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                    {a.line1}, {a.city}, {a.state} - {a.pincode}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>Phone: {a.phone}</p>
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(a.id)}
                    style={{
                      position: "absolute",
                      top: "14px",
                      right: "14px",
                      background: "none",
                      border: "none",
                      color: "#b5371b",
                      cursor: "pointer",
                    }}
                    title="Delete Address"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Wishlist */}
        {activeTab === "wishlist" && (
          <div>
            {wishlistItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--white)", borderRadius: "10px", border: "1px dashed var(--line)" }}>
                <Heart size={40} style={{ color: "var(--muted)", margin: "0 auto 12px" }} />
                <h3>Your Wishlist is Empty</h3>
                <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
                  Save your favourite spicy Andhra pickles to order anytime.
                </p>
                <Link href="/shop" className="button">
                  Discover Pickles
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
                {wishlistItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: "var(--white)",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      display: "grid",
                      gap: "8px",
                    }}
                  >
                    <strong style={{ color: "var(--green)" }}>{item.product?.name || "Handmade Pickle"}</strong>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
                      ₹{item.product?.variants?.[0]?.price ?? 299}
                    </p>
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <Link href={`/product/${item.product?.slug || ""}`} className="button" style={{ flex: 1, padding: "6px", textAlign: "center", fontSize: "0.85rem" }}>
                        View Pickle
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(item.productId || item.product?.id)}
                        className="button secondary"
                        style={{ padding: "6px 10px", color: "#b5371b" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Profile Settings */}
        {activeTab === "profile" && (
          <div style={{ maxWidth: "540px", background: "var(--white)", padding: "24px", borderRadius: "10px", border: "1px solid var(--line)" }}>
            <h3 style={{ color: "var(--green)", marginTop: 0 }}>Personal Information</h3>
            <form onSubmit={handleUpdateProfile} style={{ display: "grid", gap: "14px" }}>
              <label className="field" style={{ display: "grid", gap: "4px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Full Name</span>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                />
              </label>
              <label className="field" style={{ display: "grid", gap: "4px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Email Address</span>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--line)", background: "#f1f5f9" }}
                />
              </label>
              <label className="field" style={{ display: "grid", gap: "4px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Phone Number</span>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                />
              </label>
              <button type="submit" className="button" style={{ width: "fit-content", padding: "10px 20px" }}>
                Save Profile Changes
              </button>
            </form>
          </div>
        )}
      </section>
    </>
  );
}
