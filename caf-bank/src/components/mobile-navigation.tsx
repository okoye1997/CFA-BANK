import Link from "next/link";
import { Menu } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";

export function MobileNavigation({ links, admin = false, showSignOut = true }: { links: readonly { label: string; href: string }[]; admin?: boolean; showSignOut?: boolean }) {
  return <div className={`mobile-navigation lg:hidden text-white px-4 py-3 sm:px-5 ${admin ? "bg-[#102f5b]" : "bg-[#082d54]"}`}>
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [&::-webkit-details-marker]:hidden">
        <span className="brand !text-white !text-xl min-w-0"><span className="brand-mark shrink-0">◈</span><span className="truncate">CAF BANK</span></span>
        <span className="flex min-h-11 items-center gap-2 px-2 text-sm font-semibold"><Menu size={21} aria-hidden="true"/> Menu</span>
      </summary>
      <nav aria-label={admin ? "Administration" : "Dashboard"} className="grid grid-cols-2 sm:grid-cols-3 gap-1 pt-3 pb-2 border-t border-white/20 mt-3">
        {links.map(({ label, href }) => <Link key={`${href}:${label}`} href={href} className="min-w-0 rounded-lg px-3 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 focus-visible:bg-white/10 break-words">{label}</Link>)}
        {showSignOut && <SignOutButton/>}
      </nav>
    </details>
  </div>;
}
