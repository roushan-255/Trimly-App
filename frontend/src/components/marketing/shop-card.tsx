'use client';

import { BadgeCheck, MapPin, Scissors, Star, Users } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { PublicShop } from '@/lib/shops';

export function ShopCard({ shop }: { shop: PublicShop }) {
  const galleryImages = shop.imageUrls.length
    ? shop.imageUrls
    : shop.imageUrl
      ? [shop.imageUrl]
      : [];
  const [activeGalleryImage, setActiveGalleryImage] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const branchLocation = [shop.locality, shop.city]
    .filter(
      (part): part is string =>
        Boolean(part) &&
        part?.toLowerCase() !== shop.branchName?.toLowerCase(),
    )
    .join(', ');
  const locationLabel = [
    shop.branchName ? `${shop.branchName} branch` : null,
    branchLocation,
  ]
    .filter(Boolean)
    .join(' · ');

  const showGalleryImage = (index: number) => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    gallery.scrollTo({ left: gallery.clientWidth * index, behavior: 'smooth' });
  };

  return <article className="group/card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10">
    <div className="relative grid h-52 place-items-center overflow-hidden bg-[radial-gradient(circle_at_20%_15%,rgba(184,231,209,.65),transparent_34%),linear-gradient(135deg,#0d2231,#1f5b58)]">
      {galleryImages.length > 0 && (
        <>
          <div ref={galleryRef} onScroll={(event) => { const gallery = event.currentTarget; setActiveGalleryImage(Math.round(gallery.scrollLeft / gallery.clientWidth)); }} className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {galleryImages.map((image, index) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img key={`${image}-${index}`} src={image} alt={`${shop.name} gallery image ${index + 1}`} className="h-full min-w-full snap-center object-cover transition duration-500 group-hover/card:scale-105" />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
        </>
      )}
      <div className="pointer-events-none absolute -bottom-20 -right-12 size-56 rounded-full border border-white/10 shadow-[0_0_0_45px_rgba(255,255,255,.025),0_0_0_90px_rgba(255,255,255,.018)]" />
      <div className="pointer-events-none relative text-center text-white transition duration-500 group-hover/card:scale-105">
        {galleryImages.length === 0 && <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-white/15 bg-white/10 text-emerald-200 backdrop-blur"><Scissors className="size-8" /></span>}
        <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-100">{shop.locality || shop.city}</p>
      </div>
      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-slate-900 shadow-sm">
        {shop.rating === null ? <><Star className="size-3.5 text-emerald-600" /> New listing</> : <><Star className="size-3.5 fill-amber-400 text-amber-400" /> {shop.rating} <span className="font-medium text-slate-500">({shop.reviewCount})</span></>}
      </span>
      {shop.verified && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-extrabold text-emerald-800"><BadgeCheck className="size-3.5" /> Verified</span>}
      {galleryImages.length > 1 && (
        <div className="group/gallery absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950/35 px-3 py-2 backdrop-blur-sm transition-all duration-300 hover:gap-1.5 hover:bg-slate-950/50" aria-label={`${shop.name} gallery navigation`}>
          {galleryImages.map((_, index) => (
            <button key={index} type="button" onClick={() => showGalleryImage(index)} aria-label={`Show ${shop.name} image ${index + 1}`} aria-current={activeGalleryImage === index ? 'true' : undefined} className={`h-2 w-2 rounded-full transition-all duration-300 group-hover/gallery:h-1.5 group-hover/gallery:w-8 ${activeGalleryImage === index ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`} />
          ))}
        </div>
      )}
    </div>
    <div className="p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-extrabold tracking-tight text-slate-900">{shop.brandName}</h3><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="size-3.5 text-emerald-600" /> {locationLabel}</p></div><span className="shrink-0 text-sm font-bold text-emerald-700">{shop.startingPrice ? `From ₹${shop.startingPrice}` : 'New'}</span></div>
      <div className="my-4 grid grid-cols-2 gap-2 border-y border-slate-100 py-3 text-center text-xs"><span className="flex flex-col items-center gap-1 text-slate-500"><Users className="size-4 text-emerald-600" /><b className="text-slate-800">{shop.barberCount}</b> {shop.barberCount === 1 ? 'barber' : 'barbers'}</span><span className="flex flex-col items-center gap-1 text-slate-500"><Scissors className="size-4 text-emerald-600" /><b className="text-slate-800">{shop.serviceCount}</b> {shop.serviceCount === 1 ? 'service' : 'services'}</span></div>
      <Link href={`/shops/${shop.id}`} className="inline-flex w-full justify-center rounded-xl border border-emerald-600 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">View Shop</Link>
    </div>
  </article>;
}
