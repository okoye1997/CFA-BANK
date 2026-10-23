import { CafLogo } from "./caf-header";

type FooterItem = { label: string; href?: string };
const footerColumns: { heading: string; items: FooterItem[] }[] = [
  { heading: "CAF BANK", items: [{ label: "Current account", href: "#products" }, { label: "Savings account", href: "#products" }, { label: "Loans", href: "#products" }] },
  { heading: "HELP AND SECURITY", items: [{ label: "Security centre" }, { label: "Help" }] },
  { heading: "ABOUT CAF BANK", items: [{ label: "Regulatory information" }, { label: "Legal information" }, { label: "Board of directors" }, { label: "Executive team" }] },
  { heading: "INFORMATION", items: [{ label: "Sitemap" }, { label: "Accessibility" }, { label: "Privacy notice" }, { label: "Cookie notice" }, { label: "Modern slavery statement" }, { label: "Gender Pay Gap Report" }] },
  { heading: "CONTACT US", items: [{ label: "Call or email us" }, { label: "Complaints" }] },
];

function FooterColumn({ heading, items }: (typeof footerColumns)[number]) {
  return <div className="caf-footer-column"><h2>{heading}</h2><ul>{items.map(item => <li key={item.label}>{item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}</li>)}</ul></div>;
}

export function CafFooter() {
  return <footer className="caf-footer" id="contact"><div className="caf-footer-main"><div className="caf-container"><div className="caf-footer-brand"><CafLogo /></div><nav className="caf-footer-nav" aria-label="Footer navigation">{footerColumns.map(column => <FooterColumn key={column.heading} {...column} />)}</nav><div className="caf-organisation"><p><strong>Charities Aid Foundation © 2026</strong> | Registered Charity Number 268369</p><p>25 Kings Hill Avenue, Kings Hill, West Malling, Kent ME19 4TA</p><p>30 Old Broad Street, London EC2N 1HT</p></div></div></div><div className="caf-social"><div className="caf-container" aria-label="Social media"><span aria-label="LinkedIn" className="caf-social-mark">in</span><span aria-label="Facebook" className="caf-social-mark">f</span><span aria-label="Instagram" className="caf-social-mark">◎</span></div></div><div className="caf-copyright"><div className="caf-container">© 2026 Charities Aid Foundation. All rights reserved.</div></div></footer>;
}
