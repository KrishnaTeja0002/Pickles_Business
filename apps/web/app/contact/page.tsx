"use client";

import { useState } from "react";
import { Mail, MapPin, MessageCircle, Phone, Send, CheckCircle2, Clock } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { contentApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import styles from "../cart/commerce.module.scss";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("Pickle Inquiry / Bulk Order");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast("Please fill in your name, email, and message.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await contentApi.submitContact({
        name,
        email,
        phone: phone || undefined,
        subject,
        message,
      });
      toast("Message sent! Our kitchen team will contact you shortly.", "success");
      setSubmitted(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to submit message. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Direct Kitchen Connect"
        title="Talk to Our Andhra Pickle Masters"
        subtitle="Questions about spice levels, bulk festival orders, export queries, or custom seasoning? Reach out to us."
      />

      <section className={`section page ${styles.twoCol}`}>
        {/* Contact Form */}
        <form className={styles.panel} onSubmit={handleSubmit}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--green)" }}>Send Us a Message</h2>

          {submitted ? (
            <div style={{ textAlign: "center", padding: "30px 16px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #86efac" }}>
              <CheckCircle2 size={40} style={{ color: "#166534", margin: "0 auto 10px" }} />
              <h3 style={{ color: "#166534", margin: "0 0 6px" }}>Thank You!</h3>
              <p style={{ color: "var(--muted)", margin: "0 0 16px" }}>
                We have received your message. Our team will reply within 4-6 business hours.
              </p>
              <button type="button" className="button secondary" onClick={() => setSubmitted(false)}>
                Send Another Message
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label className="field" style={{ display: "grid", gap: "4px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Full Name *</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sita Ramaraju"
                    style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                </label>

                <label className="field" style={{ display: "grid", gap: "4px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Phone Number</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                </label>
              </div>

              <label className="field" style={{ display: "grid", gap: "4px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Email Address *</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sita@example.com"
                  style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--line)" }}
                />
              </label>

              <label className="field" style={{ display: "grid", gap: "4px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Inquiry Type</span>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--line)" }}
                >
                  <option value="Pickle Inquiry / Bulk Order">Pickle Inquiry / Bulk Festival Order</option>
                  <option value="Spice Customization">Spice Level Customization</option>
                  <option value="Order Tracking Help">Order Tracking & Delivery</option>
                  <option value="International Shipping">International Shipping Inquiry</option>
                  <option value="Other">Other Questions</option>
                </select>
              </label>

              <label className="field" style={{ display: "grid", gap: "4px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Your Message *</span>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us how we can help..."
                  style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--line)" }}
                />
              </label>

              <button
                type="submit"
                className="button"
                disabled={submitting}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px" }}
              >
                <Send size={16} /> {submitting ? "Sending..." : "Submit Inquiry"}
              </button>
            </>
          )}
        </form>

        {/* Contact Info Sidebar */}
        <aside className={styles.panel}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--green)" }}>Contact Coordinates</h2>
          <p>
            <MessageCircle size={18} style={{ color: "#25D366" }} />
            <span>WhatsApp: <strong>+91 91234 56789</strong> (Instant Chat)</span>
          </p>
          <p>
            <Mail size={18} style={{ color: "var(--mustard)" }} />
            <span>Email: <strong>support@urhometaste.com</strong></span>
          </p>
          <p>
            <Phone size={18} style={{ color: "var(--green)" }} />
            <span>Call: <strong>+91 866 245 8899</strong></span>
          </p>
          <p>
            <Clock size={18} style={{ color: "var(--muted)" }} />
            <span>Kitchen Timings: 9:00 AM – 7:30 PM (Mon-Sat)</span>
          </p>
          <p>
            <MapPin size={18} style={{ color: "#b5371b" }} />
            <span>Facility: Andhra Pradesh 520001</span>
          </p>
        </aside>
      </section>
    </>
  );
}
