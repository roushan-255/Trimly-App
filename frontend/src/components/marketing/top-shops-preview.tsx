import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ShopGrid } from './shop-grid';

export function TopShopsPreview() {
  return <section id="reviews" className="scroll-mt-24 bg-white py-20 sm:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Great shops, closer than you think</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-4xl">Top Barber Shops Near You</h2></div><Link href="/shops" className="inline-flex items-center gap-2 self-start rounded-lg text-sm font-bold text-emerald-700 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:self-auto">Explore all shops <ArrowRight className="size-4" /></Link></div><ShopGrid limit={3} /></div>
  </section>;
}
