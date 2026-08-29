import { Bell, Gift, Heart, MapPinned, Receipt, Star, UserRound, Wallet } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";

export const metadata = { title: "My Account" };

const items = [
  ["Profile", UserRound],
  ["Address Book", MapPinned],
  ["Wishlist", Heart],
  ["Order History", Receipt],
  ["Notifications", Bell],
  ["Reward Points", Star],
  ["Referral Program", Gift],
  ["Wallet", Wallet]
];

export default function AccountPage() {
  return (
    <>
      <PageHero eyebrow="Customer account" title="Everything after login" subtitle="Signup, login, OTP verification, forgot password, addresses, wishlist, orders, invoice download, notifications, rewards, referrals, coupons, gift cards, wallet, reviews, ratings, and tracking." />
      <section className="section page grid">{items.map(([label, Icon]) => <article className="card" style={{ padding: 24 }} key={String(label)}><Icon size={26} color="var(--mustard)" /><h2 style={{ color: "var(--green)" }}>{String(label)}</h2></article>)}</section>
    </>
  );
}
