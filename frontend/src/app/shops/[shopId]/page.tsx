'use client';

import {
  BadgeCheck,
  Clock3,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Scissors,
  Star,
  Store,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/marketing/navbar';
import { AuthApiError } from '@/lib/auth';
import { PublicShop, getPublicShop } from '@/lib/shops';

export default function ShopPage() {
  const params = useParams<{ shopId: string }>();
  const [shop, setShop] = useState<PublicShop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    getPublicShop(params.shopId)
      .then(setShop)
      .catch((caught: unknown) =>
        setError(
          caught instanceof AuthApiError
            ? caught.message
            : 'Unable to load this shop.',
        ),
      )
      .finally(() => setIsLoading(false));
  }, [params.shopId]);

  if (isLoading) {
    return <main className="min-h-screen bg-stone-50"><Navbar /><div className="grid min-h-[65vh] place-items-center"><div className="text-center text-sm font-semibold text-slate-500"><LoaderCircle className="mx-auto mb-3 size-7 animate-spin text-emerald-600" />Loading shop…</div></div></main>;
  }

  if (!shop || error) {
    return <main className="min-h-screen bg-stone-50"><Navbar /><div className="mx-auto max-w-3xl px-5 py-24 text-center"><Store className="mx-auto size-10 text-slate-400" /><h1 className="mt-4 text-3xl font-extrabold">Shop not found</h1><p className="mt-2 text-slate-500">{error || 'This shop is not available.'}</p><Link href="/shops" className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white">Browse all shops</Link></div></main>;
  }

  const address = [
    shop.addressLine1,
    shop.addressLine2,
    shop.city,
    shop.state,
    shop.postalCode,
    shop.country,
  ].filter(Boolean).join(', ');

  return (
    <main className="min-h-screen bg-stone-50">
      <Navbar />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          <Link href="/shops" className="text-sm font-bold text-emerald-700">← All barber shops</Link>
          <div className="mt-7 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
            <div className="relative grid h-72 place-items-center overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_20%_15%,rgba(184,231,209,.65),transparent_34%),linear-gradient(135deg,#0d2231,#1f5b58)] text-white">
              <div className="absolute -bottom-24 -right-12 size-72 rounded-full border border-white/10 shadow-[0_0_0_60px_rgba(255,255,255,.025),0_0_0_120px_rgba(255,255,255,.018)]" />
              <div className="relative text-center">
                <span className="mx-auto grid size-20 place-items-center rounded-3xl border border-white/15 bg-white/10 text-emerald-200 backdrop-blur"><Scissors className="size-10" /></span>
                <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-100">{shop.city}</p>
              </div>
            </div>
            <div className="self-center">
              <div className="flex flex-wrap items-center gap-3">
                {shop.rating === null ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">New on Trimly</span> : <p className="flex items-center gap-1 text-sm font-bold text-amber-600"><Star className="size-4 fill-current" /> {shop.rating} · {shop.reviewCount} reviews</p>}
                {shop.verified && <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700"><BadgeCheck className="size-4" /> Verified</span>}
              </div>
              <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-5xl">{shop.name}</h1>
              <p className="mt-4 flex items-start gap-2 leading-6 text-slate-600"><MapPin className="mt-1 size-4 shrink-0 text-emerald-600" /> {address}</p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                <span className="flex items-center gap-1"><Users className="size-4 text-emerald-600" /> {shop.barberCount} {shop.barberCount === 1 ? 'barber' : 'barbers'}</span>
                <span className="flex items-center gap-1"><Scissors className="size-4 text-emerald-600" /> {shop.serviceCount} {shop.serviceCount === 1 ? 'service' : 'services'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_.72fr] lg:px-10">
        <div className="space-y-10">
          <article>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-700">About the shop</p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-950">A closer look at {shop.name}</h2>
            <p className="mt-4 max-w-3xl leading-7 text-slate-600">{shop.description || 'This shop has recently joined Trimly. More information will be added by the owner soon.'}</p>
          </article>

          <article>
            <h2 className="text-2xl font-extrabold text-slate-950">Services</h2>
            {shop.services.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-sm text-slate-500">The owner has not published services yet.</div>
            ) : (
              <div className="mt-4 grid gap-3">
                {shop.services.map((service) => <div key={service.id} className="flex items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><h3 className="font-extrabold">{service.name}</h3><p className="mt-1 text-sm text-slate-500">{service.description || `${service.durationMin} minute appointment`}</p><p className="mt-2 flex items-center gap-1 text-xs font-bold text-slate-400"><Clock3 className="size-3.5" /> {service.durationMin} min</p></div><strong className="text-lg text-emerald-700">₹{service.price}</strong></div>)}
              </div>
            )}
          </article>

          <article>
            <h2 className="text-2xl font-extrabold text-slate-950">Meet the team</h2>
            {shop.barbers.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-sm text-slate-500">The owner has not added barbers yet.</div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {shop.barbers.map((barber) => <div key={barber.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="grid size-12 place-items-center rounded-full bg-[#0d2231] font-extrabold text-emerald-200">{barber.displayName.slice(0, 1).toUpperCase()}</span><h3 className="mt-4 font-extrabold">{barber.displayName}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{barber.bio || 'Barber at this Trimly location.'}</p></div>)}
              </div>
            )}
          </article>
        </div>

        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <h2 className="text-lg font-extrabold text-slate-950">Contact & location</h2>
          <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
            <p className="flex items-start gap-3"><MapPin className="mt-1 size-4 shrink-0 text-emerald-600" /> {address}</p>
            {shop.phone && <a href={`tel:${shop.phone}`} className="flex items-center gap-3 hover:text-emerald-700"><Phone className="size-4 text-emerald-600" /> {shop.phone}</a>}
            {shop.email && <a href={`mailto:${shop.email}`} className="flex items-center gap-3 hover:text-emerald-700"><Mail className="size-4 text-emerald-600" /> {shop.email}</a>}
          </div>
          <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            Online booking will become available when the owner publishes services and appointment slots.
          </div>
        </aside>
      </section>
    </main>
  );
}
