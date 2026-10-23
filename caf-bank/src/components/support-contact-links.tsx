import Link from "next/link";
import { supportContact, supportEmailHref, supportWhatsAppHref } from "@/lib/support-contact";

export function SupportContactLinks({ showInApp = true }: { showInApp?: boolean }) {
  return <div className="flex flex-wrap gap-3">
    {showInApp && <Link className="btn" href={supportContact.inAppHref}>In-app Support</Link>}
    <a className="btn btn-outline" href={supportWhatsAppHref} target="_blank" rel="noopener noreferrer">WhatsApp</a>
    <a className="btn btn-outline" href={supportEmailHref}>Email</a>
  </div>;
}
