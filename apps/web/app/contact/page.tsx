import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import styles from "../cart/commerce.module.scss";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Talk to our kitchen team" subtitle="Contact form, Google Maps-ready location area, WhatsApp, email, phone, business hours, and customer FAQs." />
      <section className={`section page ${styles.twoCol}`}>
        <form className={styles.panel}><label className="field">Name<input /></label><label className="field">Email<input /></label><label className="field">Message<textarea rows={5} /></label><button className="button">Send message</button></form>
        <aside className={styles.panel}><p><MessageCircle size={18} /> WhatsApp support</p><p><Mail size={18} /> hello@urhometaste.in</p><p><Phone size={18} /> +91 90000 00000</p><p><MapPin size={18} /> Hyderabad, Telangana · 10 AM - 7 PM</p></aside>
      </section>
    </>
  );
}
