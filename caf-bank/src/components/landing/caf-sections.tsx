import Link from "next/link";
import { ArrowRight } from "lucide-react";

const products = [
  { title: "Current account", body: "The CAF Cash Account is a safe and secure current account for everyday banking.", action: "EXPLORE CAF CASH" },
  { title: "Instant access savings account", body: "The CAF Gold Account lets you set aside surplus reserves – giving you access when you need them.", action: "EXPLORE CAF GOLD" },
  { title: "Secured loans", body: "A loan could write the next chapter of your story. Ours range from £150,000 to £10 million.", action: "EXPLORE SECURED LOANS" },
];
const impact = [
  { title: "Over 14,000 customers", body: "We support over 14,000 social purpose organisations with dedicated banking services." },
  { title: "£1.39 billion deposits", body: "Our customers entrust us with £1.39 billion in deposits." },
  { title: "£31 million in loans", body: "Loans advanced by CAF Bank to help charities and social enterprises grow sustainably." },
];

function ProductCard({ title, body, action }: (typeof products)[number]) {
  return <article className="caf-product"><h3>{title}</h3><p>{body}</p><span className="caf-text-cta">{action} <ArrowRight size={20} aria-hidden="true" /></span></article>;
}

export function CafLandingSections() {
  return <>
    <section className="caf-hero" aria-labelledby="caf-hero-title"><div className="caf-hero-photo" role="img" aria-label="Teacher and children in a classroom sharing a high five" /><div className="caf-hero-copy"><div className="caf-container"><span className="caf-kicker">CAF BANK</span><h1 id="caf-hero-title">BANKING SERVICES<br />FOR CHARITIES</h1><p>The bank dedicated to supporting charities and social purpose enterprises. So we understand what you need.</p><div className="caf-hero-actions"><Link className="caf-blue-button" href="/auth?mode=register">GET STARTED <ArrowRight aria-hidden="true" /></Link><span className="caf-text-cta">DOWNLOAD OUR<br />GUIDE TO BANKING <ArrowRight size={20} aria-hidden="true" /></span></div></div></div></section>
    <section className="caf-purpose caf-container" id="purpose"><h2>Bank on purpose</h2><p>At CAF Bank, every decision we make is designed to support organisations creating positive change. As part of the Charities Aid Foundation, we share your values and work alongside you to help achieve your mission.</p></section>
    <section className="caf-products caf-container" id="products"><h2>Explore our products</h2><div className="caf-product-grid">{products.map(product => <ProductCard key={product.title} {...product} />)}</div></section>
    <section className="caf-impact caf-container" id="impact"><h2>Our impact</h2><div className="caf-impact-grid">{impact.map(stat => <article key={stat.title}><h3>{stat.title}</h3><p>{stat.body}</p></article>)}</div></section>
    <section className="caf-resources" id="resources"><div className="caf-container"><div className="caf-feature-card caf-gold"><h2>RESOURCES FOR CHARITIES</h2><p>Tools, guidance and inspiration to help build more resilience for your charity or social enterprise.</p><span className="caf-text-cta">EXPLORE OUR RESOURCES <ArrowRight size={20} aria-hidden="true" /></span></div><a className="caf-blue-button caf-contact-button" href="#contact">CONTACT US <ArrowRight aria-hidden="true" /></a></div></section>
    <section className="caf-explore" id="about"><div className="caf-container"><h2>KEEP EXPLORING</h2><div className="caf-feature-card caf-lavender"><h3>ABOUT CAF BANK</h3><p>We know what charities need from their money. Because we’re owned by a charity ourselves.</p><a className="caf-text-cta" href="#purpose">EXPLORE CAF BANK <ArrowRight size={20} aria-hidden="true" /></a></div></div></section>
  </>;
}
