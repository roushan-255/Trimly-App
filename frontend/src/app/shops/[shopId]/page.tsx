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
import { useEffect, useRef, useState } from 'react';
import { Navbar } from '@/components/marketing/navbar';
import { BarberReviewsDrawer, ShopReviewsDrawer } from '@/components/shops/shop-reviews-drawer';
import { ShopServicesDrawer } from '@/components/shops/shop-services-drawer';
import { AuthApiError } from '@/lib/auth';
import { PublicBarber, PublicShop, getPublicShop } from '@/lib/shops';

export default function ShopPage() {
  const params = useParams<{ shopId: string }>();
  const [shop, setShop] = useState<PublicShop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [reviewedBarber, setReviewedBarber] = useState<PublicBarber | null>(null);
  const [activeGalleryImage, setActiveGalleryImage] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

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
    shop.locality,
    shop.city,
    shop.state,
    shop.postalCode,
    shop.country,
  ].filter(Boolean).join(', ');
  const galleryImages = shop.imageUrls.length
    ? shop.imageUrls
    : shop.imageUrl
      ? [shop.imageUrl]
      : [];

  const showGalleryImage = (index: number) => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    gallery.scrollTo({ left: gallery.clientWidth * index, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-stone-50">
      <Navbar />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          <Link href="/shops" className="text-sm font-bold text-emerald-700">← All barber shops</Link>
          <div className="mt-7 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
            <div className="relative grid h-72 place-items-center overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_20%_15%,rgba(184,231,209,.65),transparent_34%),linear-gradient(135deg,#0d2231,#1f5b58)] text-white">
              {galleryImages.length > 0 ? (
                <>
                  <div ref={galleryRef} onScroll={(event) => { const gallery = event.currentTarget; setActiveGalleryImage(Math.round(gallery.scrollLeft / gallery.clientWidth)); }} className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {galleryImages.map((image, index) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img key={`${image}-${index}`} src={image} alt={`${shop.name} gallery image ${index + 1}`} className="h-full min-w-full snap-center object-cover" />
                    ))}
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/20" />
                  <p className="pointer-events-none absolute bottom-5 left-5 text-sm font-extrabold uppercase tracking-[0.18em] text-white">{shop.locality || shop.city}</p>
                  {galleryImages.length > 1 && (
                    <div className="group absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950/35 px-3 py-2 backdrop-blur-sm transition-all duration-300 hover:gap-1.5 hover:bg-slate-950/50" aria-label="Shop gallery navigation">
                      {galleryImages.map((_, index) => (
                        <button key={index} type="button" onClick={() => showGalleryImage(index)} aria-label={`Show shop image ${index + 1}`} aria-current={activeGalleryImage === index ? 'true' : undefined} className={`h-2 w-2 rounded-full transition-all duration-300 group-hover:h-1.5 group-hover:w-8 ${activeGalleryImage === index ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="absolute -bottom-24 -right-12 size-72 rounded-full border border-white/10 shadow-[0_0_0_60px_rgba(255,255,255,.025),0_0_0_120px_rgba(255,255,255,.018)]" />
                  <div className="relative text-center">
                    <span className="mx-auto grid size-20 place-items-center rounded-3xl border border-white/15 bg-white/10 text-emerald-200 backdrop-blur"><Scissors className="size-10" /></span>
                    <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-100">{shop.locality || shop.city}</p>
                  </div>
                </>
              )}
            </div>
            <div className="self-center">
              <div className="flex flex-wrap items-center gap-3">
                {shop.rating === null ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">New on Trimly</span> : <button type="button" onClick={() => setReviewsOpen(true)} className="group relative isolate flex items-center gap-1 px-1 py-1 text-sm font-bold text-amber-600 transition-colors duration-200 before:pointer-events-none before:absolute before:-inset-x-1 before:-inset-y-1 before:-z-10 before:rounded-full before:bg-amber-200/0 before:blur-sm before:transition-colors before:duration-200 hover:text-amber-700 hover:before:bg-amber-200/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><Star className="size-4 fill-current transition-transform duration-200 group-hover:scale-110" /> {shop.rating} · {shop.reviewCount} reviews</button>}
                {shop.verified && <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700"><BadgeCheck className="size-4" /> Verified</span>}
              </div>
              <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-5xl">{shop.brandName}</h1>
              {shop.branchName && (
                <p className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                  {shop.branchName} branch
                </p>
              )}
              <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                {shop.description || 'This shop has recently joined Trimly. More information will be added by the owner soon.'}
              </p>
              <p className="mt-4 flex items-start gap-2 leading-6 text-slate-600"><MapPin className="mt-1 size-4 shrink-0 text-emerald-600" /> {address}</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-slate-600">
                {shop.phone && <a href={`tel:${shop.phone}`} className="flex items-center gap-2 transition hover:text-emerald-700"><Phone className="size-4 text-emerald-600" /> {shop.phone}</a>}
                {shop.email && <a href={`mailto:${shop.email}`} className="flex items-center gap-2 transition hover:text-emerald-700"><Mail className="size-4 text-emerald-600" /> {shop.email}</a>}
              </div>
              <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                <span className="flex items-center gap-1"><Users className="size-4 text-emerald-600" /> {shop.barberCount} {shop.barberCount === 1 ? 'barber' : 'barbers'}</span>
                <span className="flex items-center gap-1"><Scissors className="size-4 text-emerald-600" /> {shop.serviceCount} {shop.serviceCount === 1 ? 'service' : 'services'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_.72fr] lg:px-10">
        <div>
          <article>
            <h2 className="text-2xl font-extrabold text-slate-950">Meet the team</h2>
            {shop.barbers.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-sm text-slate-500">The owner has not added barbers yet.</div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {shop.barbers.map((barber) => <article key={barber.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300"><div className="flex items-center gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#0d2231] font-extrabold text-emerald-200">{barber.displayName.slice(0, 1).toUpperCase()}</span>{barber.rating === null ? <span className="text-xs font-bold text-slate-400">New</span> : <button type="button" onClick={() => setReviewedBarber(barber)} className="group relative isolate flex items-center gap-1 px-1 py-1 text-sm font-bold text-amber-600 transition-colors duration-200 before:pointer-events-none before:absolute before:-inset-x-1 before:-inset-y-1 before:-z-10 before:rounded-full before:bg-amber-200/0 before:blur-sm before:transition-colors before:duration-200 hover:text-amber-700 hover:before:bg-amber-200/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><Star className="size-4 fill-current transition-transform duration-200 group-hover:scale-110" /> {barber.rating} · {barber.reviewCount} {barber.reviewCount === 1 ? 'review' : 'reviews'}</button>}</div><h3 className="mt-4 font-extrabold">{barber.displayName}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{barber.bio || 'Barber at this Trimly location.'}</p><Link href={`/shops/${shop.id}/barbers/${barber.id}`} className="mt-4 inline-block text-sm font-bold text-emerald-700 hover:text-emerald-800">View availability →</Link></article>)}
              </div>
            )}
          </article>
        </div>

        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.14em] text-emerald-700">Service menu</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Popular services</h2>
            </div>
            {shop.services.length > 0 && <span className="shrink-0 text-xs font-bold text-slate-400">{shop.services.length} total</span>}
          </div>
          {shop.services.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-stone-50 p-6 text-sm text-slate-500">The owner has not published services yet.</div>
          ) : (
            <div className="mt-5 space-y-3">
              {shop.services.slice(0, 3).map((service) => (
                <article key={service.id} className="rounded-2xl bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-950">{service.name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{service.description || `${service.durationMin} minute service`}</p>
                    </div>
                    <strong className="shrink-0 text-emerald-700">₹{service.price}</strong>
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-xs font-bold text-slate-400"><Clock3 className="size-3.5" /> {service.durationMin} min</p>
                </article>
              ))}
              <button type="button" onClick={() => setServicesOpen(true)} className="mt-2 flex w-full items-center justify-center rounded-xl border border-emerald-600 px-4 py-3 text-sm font-extrabold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100">
                View all services
              </button>
            </div>
          )}
        </aside>
      </section>
      {shop.rating !== null && (
        <ShopReviewsDrawer open={reviewsOpen} shopId={shop.id} shopName={shop.name} rating={shop.rating} reviewCount={shop.reviewCount} onClose={() => setReviewsOpen(false)} />
      )}
      {reviewedBarber && reviewedBarber.rating !== null && (
        <BarberReviewsDrawer open shopId={shop.id} barberId={reviewedBarber.id} barberName={reviewedBarber.displayName} rating={reviewedBarber.rating} reviewCount={reviewedBarber.reviewCount} onClose={() => setReviewedBarber(null)} />
      )}
      <ShopServicesDrawer open={servicesOpen} shopName={shop.name} services={shop.services} onClose={() => setServicesOpen(false)} />
    </main>
  );
}
