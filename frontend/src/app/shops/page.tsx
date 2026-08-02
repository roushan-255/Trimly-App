'use client';

import { Navbar } from '@/components/marketing/navbar';
import { ShopGrid } from '@/components/marketing/shop-grid';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export default function ShopsPage() {
  return <Suspense fallback={<main className="min-h-screen bg-stone-50"><Navbar /></main>}><ShopDirectory /></Suspense>;
}

function ShopDirectory() {
  const params = useSearchParams();
  const search = params.get('location') || params.get('service') || undefined;

  return <main className="min-h-screen bg-stone-50"><Navbar /><section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10"><p className="text-sm font-bold uppercase tracking-[.16em] text-emerald-700">Browse freely</p><h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950">Barber shops near you</h1><p className="mt-3 max-w-2xl text-slate-600">{search ? `Showing shops matching “${search}”.` : 'Compare registered shops, services, barbers, and reviews. You only need an account when you are ready to book.'}</p><div className="mt-10"><ShopGrid limit={50} search={search} /></div></section></main>;
}
