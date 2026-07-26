import { CheckCircle2, Star } from 'lucide-react';
import { ShopSearchForm } from './shop-search-form';

export function HeroSection() {
  return (
    <section className="relative bg-white pb-28 pt-12 sm:pt-16 lg:pb-36 lg:pt-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:px-10">
        <div className="max-w-2xl">
          <p className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-emerald-700"><span className="size-2 rounded-full bg-emerald-500" /> Better barbering begins here</p>
          <h1 className="text-balance text-5xl font-extrabold tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl lg:leading-[0.98]">Find the Right Barber, Not Just the Nearest Shop.</h1>
          <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-slate-600">Discover top-rated barber shops, compare barbers, check live availability, and book your preferred slot in seconds.</p>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-slate-600">
            <span className="flex items-center gap-2"><CheckCircle2 className="size-5 text-emerald-600" /> Trusted local shops</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="size-5 text-emerald-600" /> Easy booking</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
          <div className="absolute -inset-4 -z-0 rounded-[2.5rem] bg-emerald-100/70 blur-2xl" />
          <img src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1400&q=85" alt="Barber styling a customer's hair in a contemporary shop" className="relative h-[340px] w-full rounded-[2rem] object-cover shadow-2xl shadow-slate-900/15 sm:h-[460px]" />
          <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-xl shadow-slate-900/10 sm:-left-7 sm:bottom-7 sm:px-5">
            <span className="grid size-10 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Star className="size-5 fill-current" /></span>
            <span><strong className="block text-sm font-extrabold text-slate-900">1,000+ Happy Customers</strong><small className="text-xs font-medium text-slate-500">Found their go-to shop</small></span>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 -bottom-20 z-10 mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10"><ShopSearchForm /></div>
    </section>
  );
}
