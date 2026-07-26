import { CalendarClock, MapPin, Scissors, Star, Users } from 'lucide-react';
import Link from 'next/link';

export type Shop = { id: string; name: string; image: string; rating: string; reviews: number; distance: string; barbers: number; slots: number; wait: string; price: number; };

export function ShopCard({ shop }: { shop: Shop }) {
  return <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10">
    <div className="relative h-52 overflow-hidden"><img src={shop.image} alt={`${shop.name} interior`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-slate-900 shadow-sm"><Star className="size-3.5 fill-amber-400 text-amber-400" /> {shop.rating} <span className="font-medium text-slate-500">({shop.reviews})</span></span></div>
    <div className="p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-extrabold tracking-tight text-slate-900">{shop.name}</h3><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="size-3.5 text-emerald-600" /> {shop.distance}</p></div><span className="shrink-0 text-sm font-bold text-emerald-700">From ₹{shop.price}</span></div>
      <div className="my-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 text-center text-xs"><span className="flex flex-col items-center gap-1 text-slate-500"><Users className="size-4 text-emerald-600" /><b className="text-slate-800">{shop.barbers}</b> barbers</span><span className="flex flex-col items-center gap-1 text-slate-500"><CalendarClock className="size-4 text-emerald-600" /><b className="text-slate-800">{shop.slots}</b> slots today</span><span className="flex flex-col items-center gap-1 text-slate-500"><Scissors className="size-4 text-emerald-600" /><b className="text-slate-800">{shop.wait}</b> avg. wait</span></div>
      <Link href={`/shops/${shop.id}`} className="inline-flex w-full justify-center rounded-xl border border-emerald-600 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">View Shop</Link>
    </div>
  </article>;
}
