import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ShopGrid } from './shop-grid';

export function TopShopsPreview() {
  return (
    <section id="reviews" className="scroll-mt-24 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
            Great shops, closer than you think
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-4xl">
            Top Barber Shops Near You
          </h2>
        </div>

        <ShopGrid limit={3} />

        <div className="mt-10 flex justify-center">
          <Link
            href="/shops"
            className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-emerald-700 transition-colors hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            Explore all shops
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
