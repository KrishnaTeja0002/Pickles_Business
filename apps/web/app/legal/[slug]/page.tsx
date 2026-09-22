import { ShieldCheck, Truck, RotateCcw, FileText, Lock, Cookie, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";

type PolicyContent = {
  title: string;
  eyebrow: string;
  subtitle: string;
  icon: any;
  lastUpdated: string;
  sections: Array<{
    heading: string;
    body: string | string[];
  }>;
};

const policies: Record<string, PolicyContent> = {
  "privacy-policy": {
    title: "Privacy Policy",
    eyebrow: "Customer Data Protection",
    subtitle: "Your personal details, contact information, and delivery coordinates are strictly protected with 256-bit SSL encryption.",
    icon: Lock,
    lastUpdated: "September 2026",
    sections: [
      {
        heading: "1. Information We Collect",
        body: "When you place an order or create an account with Ur Home Taste, we collect essential delivery information including your full name, email address, phone number, and physical shipping address. We do not store your raw credit card numbers or UPI MPINs — all payments are securely processed through RBI-authorized payment gateways (Razorpay)."
      },
      {
        heading: "2. How We Use Your Information",
        body: [
          "To pack, label, and dispatch your ordered pickle jars to your doorstep via express courier partners.",
          "To send SMS and email tracking links and updates regarding your delivery status.",
          "To process refunds, replacements, or customer support inquiries.",
          "To share occasional festival batch announcements or special discounts (which you can opt out of anytime with a single click)."
        ]
      },
      {
        heading: "3. Zero Third-Party Data Selling",
        body: "We will never sell, rent, or trade your personal information to third-party marketing agencies, advertisers, or data brokers. Your information is shared only with vetted operational partners strictly necessary to fulfill your order (e.g., Blue Dart, Delhivery, DTDC for courier dispatch)."
      },
      {
        heading: "4. Data Security",
        body: "Our web applications use industry-standard HTTPS encryption with 256-bit SSL certificates. Password hashes are encrypted using modern salted bcrypt hashing algorithms, and session tokens are protected with secure, HTTP-only cookies."
      },
      {
        heading: "5. Contact Our Privacy Officer",
        body: "If you wish to review, update, or permanently delete your account data from our databases, please write to us at support@urhometaste.com or WhatsApp us at +91 91234 56789."
      }
    ]
  },
  "shipping-policy": {
    title: "Shipping & Delivery Policy",
    eyebrow: "Safe Doorstep Fulfillment",
    subtitle: "Hand-packed in food-grade, vacuum-sealed jars and dispatched via verified express couriers across all 28 Indian states.",
    icon: Truck,
    lastUpdated: "September 2026",
    sections: [
      {
        heading: "1. Dispatch Timelines",
        body: "Every jar of Ur Home Taste pickle is checked, sealed, and prepared in small batches. Orders placed before 1:00 PM are dispatched within 24 business hours. Orders placed over weekends or national holidays are dispatched on the next working day."
      },
      {
        heading: "2. Estimated Delivery Transit Time",
        body: [
          "Andhra Pradesh & Telangana: 1 to 2 business days.",
          "South India (Karnataka, Tamil Nadu, Kerala): 2 to 3 business days.",
          "Rest of India (Maharashtra, Delhi NCR, Gujarat, West Bengal, etc.): 3 to 5 business days.",
          "Remote locations and North East India: 5 to 7 business days."
        ]
      },
      {
        heading: "3. Shipping Charges & Free Delivery",
        body: "We offer completely FREE delivery on all orders of ₹999 or more across India. For orders below ₹999, a flat subsidized shipping fee of ₹59 is applied at checkout to cover express courier costs."
      },
      {
        heading: "4. Zero-Leakage Packing Guarantee",
        body: "Pickle shipments require extraordinary packaging care. Every jar features an induction inner foil seal, a leak-proof screw cap with tamper-evident shrink wrap, and shock-absorbing air-cushion packaging to ensure your pickle arrives pristine without a single drop of oil spilled."
      },
      {
        heading: "5. Real-Time Consignment Tracking",
        body: "Once your package is handed over to our courier partner (Blue Dart, Delhivery, DTDC, or Speed Post), you will immediately receive an SMS and email with your AWB tracking number and direct live tracking link. You can also track your shipment anytime via our website's Track Order portal."
      }
    ]
  },
  "refund-policy": {
    title: "Refund & Replacement Policy",
    eyebrow: "Customer Satisfaction Promise",
    subtitle: "100% money-back or free instant replacement guarantee if your jar arrives broken, damaged, or unsealed.",
    icon: RotateCcw,
    lastUpdated: "September 2026",
    sections: [
      {
        heading: "1. The Ur Home Taste Guarantee",
        body: "We stand behind the authentic taste, safety, and hygiene of every single pickle jar we make. Because our pickles are perishable food items prepared with pure cold-pressed oils, we do not accept returns once a jar is opened. However, we offer complete replacement or refund coverage for transit damage."
      },
      {
        heading: "2. Eligible Replacement / Refund Scenarios",
        body: [
          "A jar arrived broken, cracked, or leaking oil upon delivery.",
          "The outer tamper-evident seal or inner induction foil was punctured or broken.",
          "An incorrect pickle variety or jar size was delivered compared to your order confirmation.",
          "The package was lost in transit or confirmed missing by the courier partner."
        ]
      },
      {
        heading: "3. How to Claim a Free Replacement",
        body: "Simply take a quick photo of the damaged jar or package and send it to us via WhatsApp at +91 91234 56789 or email support@urhometaste.com within 48 hours of delivery. Our customer team will process a priority replacement dispatch within 24 hours — zero hassle, zero return shipping required."
      },
      {
        heading: "4. Refund Processing Time",
        body: "If you prefer a refund instead of a fresh replacement jar, your refund will be processed immediately back to your original payment method (UPI, Google Pay, PhonePe, Debit/Credit Card, or NetBanking). Funds typically reflect in your bank account within 3 to 5 business days."
      }
    ]
  },
  "return-policy": {
    title: "Return Policy",
    eyebrow: "Food Safety & Hygiene Guidelines",
    subtitle: "In accordance with FSSAI hygiene guidelines, perishable homemade food items cannot be returned once delivered.",
    icon: RotateCcw,
    lastUpdated: "September 2026",
    sections: [
      {
        heading: "1. Non-Returnable Perishable Goods",
        body: "Under food safety regulations and FSSAI standards, packaged artisanal food products, pickles, and condiments cannot be accepted back into our food storage facility once delivered to a recipient's doorstep. This ensures zero contamination risk for all our customers."
      },
      {
        heading: "2. Instant Replacements Instead of Physical Returns",
        body: "If your jar arrives damaged, cracked, or leaking, you do NOT need to mail the broken jar back to us. Simply contact us with a photo, and we will issue a full refund or send a fresh replacement jar immediately at our cost."
      },
      {
        heading: "3. Order Cancellations",
        body: "You can cancel any order free of charge from your Account page or Track Order portal anytime before it is dispatched from our kitchen facility. Once an order is handed over to the courier partner, cancellation is no longer possible."
      }
    ]
  },
  "terms-and-conditions": {
    title: "Terms & Conditions",
    eyebrow: "User Agreement & Service Terms",
    subtitle: "Transparent terms governing your orders, payments, accounts, and use of the Ur Home Taste platform.",
    icon: FileText,
    lastUpdated: "September 2026",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: "By accessing www.urhometaste.com, placing an order, or creating an account, you agree to be bound by these terms, our Privacy Policy, and our Fulfillment Guidelines. If you do not agree with any part of these terms, please discontinue use of the site."
      },
      {
        heading: "2. Artisanal Food & Natural Variation",
        body: "Our pickles are handmade in small artisanal batches using seasonal crops, natural stone-ground spices, and cold-pressed oils without chemical thickeners or artificial coloring. As with all genuine homemade foods, subtle natural variations in tartness, color, or spice heat may occur between harvest seasons."
      },
      {
        heading: "3. Pricing & Payment Terms",
        body: "All prices on our website are listed in Indian Rupees (INR) and are inclusive of GST. Prices displayed for individual jar sizes reflect the active catalog values. We reserve the right to modify prices or discontinue products based on crop seasons and ingredient availability."
      },
      {
        heading: "4. Account Responsibilities",
        body: "You are responsible for maintaining the confidentiality of your account login credentials. Please provide accurate delivery addresses, valid pin codes, and working phone numbers to ensure timely courier delivery."
      },
      {
        heading: "5. Intellectual Property",
        body: "All brand trademarks, logo marks, recipe names, product photography, and website content are the exclusive intellectual property of Ur Home Taste."
      }
    ]
  },
  "cookie-policy": {
    title: "Cookie Policy",
    eyebrow: "Essential Session Cookies",
    subtitle: "We use only strictly necessary cookies to keep your shopping cart intact and maintain secure session login.",
    icon: Cookie,
    lastUpdated: "September 2026",
    sections: [
      {
        heading: "1. What Are Cookies?",
        body: "Cookies are small, secure text files placed on your browser when you visit a website. They allow the website to remember your session, keep items in your shopping bag, and remember your delivery preferences."
      },
      {
        heading: "2. The Only Cookies We Use",
        body: [
          "Session & Authentication Cookies: Secure HTTP-only cookies that keep you signed in to your account and protect against CSRF attacks.",
          "Cart Persistence: Local storage cookies that remember your selected pickle jars while you browse different pages.",
          "Performance & Security: Anonymous security cookies that prevent bot traffic and ensure fast server response times."
        ]
      },
      {
        heading: "3. No Invasive Tracking or Third-Party Ad Cookies",
        body: "We do NOT use invasive cross-site ad tracking cookies or sell cookie data to third-party ad networks. Our cookies exist solely to make your shopping experience smooth, fast, and safe."
      },
      {
        heading: "4. Managing Cookies",
        body: "You can control or clear cookies at any time through your browser settings. Note that disabling essential cookies may prevent you from adding items to your cart or completing checkout."
      }
    ]
  }
};

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolved = await Promise.resolve(params);
  const slug = resolved.slug;
  const policy = policies[slug];
  return {
    title: policy ? `${policy.title} - Ur Home Taste` : "Legal Policy - Ur Home Taste",
    description: policy?.subtitle || "Legal policies and customer terms for Ur Home Taste.",
  };
}

export default async function LegalPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolved = await Promise.resolve(params);
  const slug = resolved.slug;
  const policy = policies[slug];

  if (!policy) {
    notFound();
  }

  const Icon = policy.icon;

  return (
    <>
      <PageHero
        eyebrow={policy.eyebrow}
        title={policy.title}
        subtitle={policy.subtitle}
      />

      <section className="section page" style={{ maxWidth: "860px", margin: "0 auto 64px" }}>
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: "12px",
            padding: "36px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              borderBottom: "1px solid var(--line)",
              paddingBottom: "20px",
              marginBottom: "28px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  background: "rgba(24, 63, 44, 0.08)",
                  color: "var(--green)",
                  borderRadius: "8px",
                  padding: "10px",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.3rem", color: "var(--green)" }}>{policy.title}</h2>
                <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                  Last Updated: {policy.lastUpdated}
                </span>
              </div>
            </div>

            <Link
              href="/shop"
              style={{
                fontSize: "0.88rem",
                fontWeight: 700,
                color: "var(--brown)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ArrowLeft size={16} /> Back to Shop
            </Link>
          </div>

          <div style={{ display: "grid", gap: "28px" }}>
            {policy.sections.map((section, idx) => (
              <div key={idx}>
                <h3 style={{ fontSize: "1.1rem", color: "var(--green)", margin: "0 0 10px" }}>
                  {section.heading}
                </h3>
                {Array.isArray(section.body) ? (
                  <ul style={{ margin: 0, paddingLeft: "20px", display: "grid", gap: "8px" }}>
                    {section.body.map((item, i) => (
                      <li key={i} style={{ fontSize: "0.93rem", color: "var(--muted)", lineHeight: 1.65 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.93rem", color: "var(--muted)", lineHeight: 1.7 }}>
                    {section.body}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick links to other policies */}
        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block", marginBottom: "12px" }}>
            Other Customer Policies:
          </span>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            {Object.entries(policies).map(([k, p]) => (
              <Link
                key={k}
                href={`/legal/${k}`}
                style={{
                  fontSize: "0.82rem",
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: "1px solid var(--line)",
                  background: k === slug ? "var(--green)" : "var(--white)",
                  color: k === slug ? "#fff" : "var(--green)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {p.title}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
