import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Shop, ShopCard } from './shop-card';

const shops: Shop[] = [
  { id: 'the-gentlemans-chair', name: "The Gentleman's Chair", image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=85', rating: '4.9', reviews: 286, distance: '1.2 km away', barbers: 6, slots: 4, wait: '8 min', price: 299 },
  { id: 'blade-and-brush', name: 'Blade & Brush', image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=900&q=85', rating: '4.8', reviews: 174, distance: '2.4 km away', barbers: 4, slots: 6, wait: '12 min', price: 249 },
  { id: 'northside-barber-co', name: 'Northside Barber Co.', image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=900&q=85', rating: '4.9', reviews: 203, distance: '3.1 km away', barbers: 5, slots: 3, wait: '10 min', price: 349 },
];

export function TopShopsPreview() {
  return <section id="reviews" className="scroll-mt-24 bg-white py-20 sm:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Great shops, closer than you think</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-4xl">Top Barber Shops Near You</h2></div><Link href="/shops" className="inline-flex items-center gap-2 self-start rounded-lg text-sm font-bold text-emerald-700 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:self-auto">Explore all shops <ArrowRight className="size-4" /></Link></div><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{shops.map((shop) => <ShopCard key={shop.id} shop={shop} />)}</div></div>
  </section>;
}
