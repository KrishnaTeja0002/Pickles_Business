import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let csrfToken: string | null = null;

async function fetchCsrfToken() {
  try {
    const res = await api.get("/csrf-token");
    csrfToken = res.data.csrfToken;
  } catch {
    // CSRF endpoint not available
  }
}

// Request interceptor: attach CSRF token
api.interceptors.request.use(async (config) => {
  if (["post", "put", "patch", "delete"].includes(config.method ?? "")) {
    if (!csrfToken) await fetchCsrfToken();
    if (csrfToken) config.headers["x-csrf-token"] = csrfToken;
  }
  return config;
});

// Response interceptor: auto-refresh token on 401
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes("/auth/")) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const res = await api.post("/auth/refresh");
          isRefreshing = false;
          onRefreshed(res.data.accessToken);
          return api(originalRequest);
        } catch {
          isRefreshing = false;
          refreshSubscribers = [];
          // Clear auth state - redirect to login
          if (typeof window !== "undefined") {
            const event = new CustomEvent("auth:logout");
            window.dispatchEvent(event);
          }
          return Promise.reject(error);
        }
      }

      return new Promise((resolve) => {
        refreshSubscribers.push(() => resolve(api(originalRequest)));
      });
    }

    return Promise.reject(error);
  }
);

// ─── API Functions ───

// Auth
export const authApi = {
  signup: (data: { name: string; email: string; phone?: string; password: string }) =>
    api.post("/auth/signup", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  refresh: () => api.post("/auth/refresh"),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post("/auth/reset-password", { token, password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/auth/change-password", { currentPassword, newPassword }),
};

// Catalog
export const catalogApi = {
  getCategories: () => api.get("/catalog/categories"),
  getProducts: (params?: Record<string, any>) => api.get("/catalog/products", { params }),
  getProduct: (slug: string) => api.get(`/catalog/products/${slug}`),
  searchSuggestions: (q?: string) => api.get("/catalog/search/suggestions", { params: { q } }),
};

// Cart
export const cartApi = {
  getCart: () => api.get("/cart"),
  addItem: (data: { productId: string; variantId: string; quantity?: number }) =>
    api.post("/cart/items", data),
  updateItem: (itemId: string, quantity: number) =>
    api.patch(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}`),
  clearCart: () => api.delete("/cart"),
  getQuote: (data: { items: Array<{ variantId: string; quantity: number }>; coupon?: string; pincode?: string }) =>
    api.post("/cart/quote", data),
  validateCoupon: (code: string, subtotal: number) =>
    api.post("/cart/validate-coupon", { code, subtotal }),
};

// Orders
export const orderApi = {
  list: (params?: { page?: number }) => api.get("/orders", { params }),
  get: (id: string) => api.get(`/orders/${id}`),
  track: (query: string) => api.get(`/orders/track/${encodeURIComponent(query.trim())}`),
  create: (data: any) => api.post("/orders", data),
  cancel: (id: string, reason?: string) => api.patch(`/orders/${id}/cancel`, { reason }),
};

// Payments
export const paymentApi = {
  createOrder: (orderId: string, method: string) =>
    api.post("/payments/razorpay/order", { orderId, method }),
  verify: (data: { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; signature: string }) =>
    api.post("/payments/razorpay/verify", data),
  simulateSuccess: (orderId: string) =>
    api.post("/payments/dev/simulate-success", { orderId }),
};

// User
export const userApi = {
  getProfile: () => api.get("/users/me"),
  updateProfile: (data: { name?: string; phone?: string }) => api.patch("/users/me", data),
  getAddresses: () => api.get("/users/me").then(res => res.data.user.addresses),
  createAddress: (data: any) => api.post("/users/addresses", data),
  updateAddress: (id: string, data: any) => api.patch(`/users/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/users/addresses/${id}`),
  getWishlist: () => api.get("/users/wishlist"),
  addToWishlist: (productId: string) => api.post(`/users/wishlist/${productId}`),
  removeFromWishlist: (productId: string) => api.delete(`/users/wishlist/${productId}`),
  addReview: (productId: string, data: { rating: number; title: string; body: string }) =>
    api.post(`/users/reviews/${productId}`, data),
  getNotifications: () => api.get("/users/notifications"),
  markNotificationRead: (id: string) => api.patch(`/users/notifications/${id}/read`),
};

// Content
export const contentApi = {
  getBlog: () => api.get("/content/blog"),
  subscribeNewsletter: (email: string, source?: string) =>
    api.post("/content/newsletter", { email, source }),
  submitContact: (data: { name: string; email: string; message: string; phone?: string; subject?: string }) =>
    api.post("/content/contact", data),
  getFaqs: () => api.get("/content/faqs"),
  getShippingInfo: () => api.get("/content/shipping-info"),
};

// Admin
export const adminApi = {
  getDashboard: () => api.get("/admin/dashboard"),
  getOrders: (params?: any) => api.get("/admin/orders", { params }),
  getOrder: (id: string) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, data: { status: string; note?: string; trackingNumber?: string; courier?: string }) =>
    api.patch(`/admin/orders/${id}/status`, data),
  processRefund: (id: string) => api.post(`/admin/orders/${id}/refund`),
  getProducts: (params?: any) => api.get("/admin/products", { params }),
  createProduct: (data: any) => api.post("/admin/products", data),
  bulkUpdateProducts: (items: any[]) => api.post("/admin/products/bulk", { items }),
  updateProduct: (id: string, data: any) => api.patch(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  updateVariant: (id: string, data: any) => api.patch(`/admin/variants/${id}`, data),
  updateInventory: (variantId: string, stock: number, reason?: string) =>
    api.patch(`/admin/inventory/${variantId}`, { stock, reason }),
  getCategories: () => api.get("/admin/categories"),
  createCategory: (data: any) => api.post("/admin/categories", data),
  updateCategory: (id: string, data: any) => api.patch(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),
  getCoupons: () => api.get("/admin/coupons"),
  createCoupon: (data: any) => api.post("/admin/coupons", data),
  updateCoupon: (id: string, data: any) => api.patch(`/admin/coupons/${id}`, data),
  getReviews: (params?: any) => api.get("/admin/reviews", { params }),
  moderateReview: (id: string, isApproved: boolean) => api.patch(`/admin/reviews/${id}`, { isApproved }),
  deleteReview: (id: string) => api.delete(`/admin/reviews/${id}`),
  getCustomers: (params?: any) => api.get("/admin/customers", { params }),
  getShipping: () => api.get("/admin/shipping"),
  updateShipping: (id: string, data: any) => api.patch(`/admin/shipping/${id}`, data),
  exportOrders: () => api.get("/admin/reports/export/orders"),
};
