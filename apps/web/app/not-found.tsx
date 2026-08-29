import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section page">
      <span className="eyebrow">404</span>
      <h1 className="title">This jar is missing</h1>
      <p className="subtitle">The page you are looking for is unavailable or has moved.</p>
      <Link className="button" href="/shop">Back to shop</Link>
    </section>
  );
}
