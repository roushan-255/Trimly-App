import { Navbar } from '@/components/marketing/navbar';
import { TopShopsPreview } from '@/components/marketing/top-shops-preview';

export default function ShopsPage() {
  return <main className="min-h-screen bg-stone-50"><Navbar /><div className="mx-auto max-w-7xl px-5 pb-2 pt-12 sm:px-8 lg:px-10"><p className="text-sm font-bold uppercase tracking-[.16em] text-emerald-700">Browse freely</p><h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950">Barber shops near you</h1><p className="mt-3 max-w-2xl text-slate-600">Compare shops, services, barbers, reviews and available slots. You only need an account when you&apos;re ready to book.</p></div><TopShopsPreview /></main>;
}
