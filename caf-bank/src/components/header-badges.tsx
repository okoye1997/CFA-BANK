"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CircleHelp, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { io } from "socket.io-client";
import { useTranslations } from "next-intl";
export function HeaderBadges({ initial }: { initial: { messages: number; notifications: number; support: number } }) {
  const navigation = useTranslations("navigation");
  const common = useTranslations("common");
  const [counts, setCounts] = useState(initial);
  useEffect(() => {
    const refresh = () => { fetch("/api/dashboard/counts").then(r => r.ok ? r.json() : null).then(data => { if (data) setCounts(data); }); };
    const socket = io({ path: "/socket.io" });
    socket.on("notification:new", refresh);
    window.addEventListener("focus", refresh);
    return () => { socket.disconnect(); window.removeEventListener("focus", refresh); };
  }, []);
  const items: { label: string; href: string; Icon: LucideIcon; count: number }[] = [{ label: navigation("messages"), href: "/dashboard/messages", Icon: Mail, count: counts.messages }, { label: common("notifications"), href: "/dashboard/notifications", Icon: Bell, count: counts.notifications }, { label: navigation("support"), href: "/dashboard/support", Icon: CircleHelp, count: counts.support }];
  return <>{items.map(({ label, href, Icon, count }) => <Link key={label} href={href} aria-label={label} className="relative"><Icon size={21}/>{count > 0 && <span className="absolute -right-2 -top-2 text-xs bg-blue-600 text-white rounded-full px-1">{count}</span>}</Link>)}</>;
}
