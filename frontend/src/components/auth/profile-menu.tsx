'use client';

import { ChevronDown, Heart, LogOut, MessageSquareText, Scissors, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from './auth-provider';

const items = [
  { label: 'My Bookings', icon: Scissors, href: '/bookings' },
  { label: 'Favourite Shops', icon: Heart, href: '/favorites/shops' },
  { label: 'Favourite Barbers', icon: Heart, href: '/favorites/barbers' },
  { label: 'My Reviews', icon: MessageSquareText, href: '/reviews' },
];

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const { customer, signOut } = useAuth();
  if (!customer) return null;
  return <div className="relative z-[60]"><button type="button" onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-full p-1 pr-2 text-sm font-bold text-slate-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600" aria-expanded={open} aria-haspopup="menu" aria-label="Open profile menu"><span className="grid size-8 place-items-center rounded-full bg-emerald-600 text-xs text-white">{customer.firstName.slice(0, 1).toUpperCase()}</span><ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} /></button>{open && <div role="menu" className="absolute right-0 top-full z-[70] mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/15"><p className="border-b border-slate-100 px-3 py-2 text-sm font-bold text-slate-900">Hi, {customer.firstName}</p>{items.map(({ label, icon: Icon, href }) => <a key={label} href={href} role="menuitem" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"><Icon className="size-4" />{label}</a>)}<div className="my-1 border-t border-slate-100" /><button type="button" role="menuitem" onClick={() => { signOut(); setOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"><LogOut className="size-4" />Log Out</button></div>}</div>;
}
