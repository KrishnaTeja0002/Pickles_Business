import { BarChart3, Boxes, CreditCard, Download, Settings, ShieldCheck, Truck, Users } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";

export const metadata = { title: "Admin Panel" };

const modules = ["Analytics", "Revenue", "Orders", "Customers", "Products", "Categories", "Inventory", "Coupons", "Offers", "Reviews", "Payments", "Refunds", "Delivery Status", "Reports", "Newsletter Subscribers", "Notifications", "Role Management", "Settings"];

export default function AdminPage() {
  return (
    <>
      <PageHero eyebrow="Admin" title="Operations dashboard" subtitle="Secure admin login, analytics, exports, inventory alerts, role management, refunds, delivery status, notifications, and settings." />
      <section className="section page">
        <div className="grid">{[[BarChart3, "Revenue ₹8.4L"], [Users, "Customers 12.8K"], [Boxes, "Inventory 84 SKUs"], [CreditCard, "Payments 99.2% success"], [Truck, "Delivery SLA 94%"], [ShieldCheck, "Roles secured"], [Download, "Exports ready"], [Settings, "Settings"]].map(([Icon, label]) => <article className="card" style={{ padding: 22 }} key={String(label)}><Icon size={26} color="var(--mustard)" /><h2 style={{ color: "var(--green)" }}>{String(label)}</h2></article>)}</div>
        <div style={{ marginTop: 24 }} className="grid">{modules.map((module) => <article className="card" style={{ padding: 18, color: "var(--green)", fontWeight: 900 }} key={module}>{module}</article>)}</div>
      </section>
    </>
  );
}
