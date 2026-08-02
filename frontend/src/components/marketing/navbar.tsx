'use client';

import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { ProfileMenu } from '@/components/auth/profile-menu';
import { Brand } from './brand';

const navigation = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#reviews', label: 'Reviews' },
  { href: '/owner/register', label: 'For Shop Owners' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { customer, ready, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Brand />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {navigation.map((item) => <a key={item.href} href={item.href} className="rounded-md text-sm font-semibold text-slate-600 transition hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">{item.label}</a>)}
          {ready && customer ? <ProfileMenu /> : <><a href="/customer/login" className="rounded-lg px-1 py-2 text-sm font-bold text-slate-700 transition hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">Log In</a><a href="/signup" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">Sign Up</a></>}
        </nav>
        <button type="button" className="rounded-lg p-2 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 md:hidden" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && <nav className="border-t border-slate-100 bg-white px-5 py-4 shadow-lg md:hidden" aria-label="Mobile navigation">
        <div className="mx-auto grid max-w-7xl gap-1">
          {navigation.map((item) => <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700">{item.label}</a>)}
          {ready && customer ? <><a href="/bookings" className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-emerald-50">My Bookings</a><button type="button" onClick={() => { signOut(); setOpen(false); }} className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50">Log Out</button></> : <><a href="/customer/login" className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-emerald-50">Log In</a><a href="/signup" className="rounded-lg bg-emerald-600 px-3 py-3 text-sm font-bold text-white hover:bg-emerald-700">Sign Up</a></>}
        </div>
      </nav>}
    </header>
  );
}
