import styles from "./PageHero.module.scss";

export function PageHero({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <section className={styles.hero}>
      <div className="page">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="title">{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>
    </section>
  );
}
