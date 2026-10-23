"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search, UserRound, X } from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";

export function CafLogo() {
  return <span className="caf-logo" aria-label="CAF Bank"><strong>CAF</strong><small>Bank</small></span>;
}

export function CafHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  return <header className="caf-header">
    <div className="caf-topbar"><span>CHARITIES AID FOUNDATION</span><Link href="/" aria-current="page">CAF BANK</Link></div>
    <div className="caf-toolbar">
      <button type="button" className="caf-icon-button caf-menu-button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="caf-primary-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      <div className="caf-toolbar-spacer" />
      <Link className="caf-icon-button" href="/auth" aria-label="Sign in"><UserRound /></Link>
      <button type="button" className="caf-icon-button" aria-label="Search this page" aria-expanded={searchOpen} aria-controls="caf-search" onClick={() => setSearchOpen(!searchOpen)}><Search /></button>
      <Link className="caf-logo-panel" href="/" aria-label="CAF Bank home"><CafLogo /></Link>
    </div>
    {searchOpen && <form id="caf-search" className="caf-search" onSubmit={event => { event.preventDefault(); const value = new FormData(event.currentTarget).get("search")?.toString().trim().toLowerCase(); if (value) Array.from(document.querySelectorAll<HTMLElement>("main h1, main h2, main h3")).find(section => section.textContent?.toLowerCase().includes(value))?.scrollIntoView({ behavior: "smooth" }); }}><label htmlFor="caf-search-field">Search this page</label><input id="caf-search-field" name="search" type="search" placeholder="Search sections" /><button type="submit">Search</button></form>}
    {menuOpen && <nav id="caf-primary-nav" className="caf-primary-nav" aria-label="Main navigation"><a href="#products" onClick={() => setMenuOpen(false)}>Products</a><a href="#impact" onClick={() => setMenuOpen(false)}>Our impact</a><a href="#resources" onClick={() => setMenuOpen(false)}>Resources</a><a href="#about" onClick={() => setMenuOpen(false)}>About CAF Bank</a><a href="#contact" onClick={() => setMenuOpen(false)}>Contact us</a><Link href="/auth?mode=register">Create Account</Link><LanguageSelector compact /></nav>}
  </header>;
}
