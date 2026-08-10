'use client';

import { LoaderCircle, Star, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AuthApiError } from '@/lib/auth';
import {
  getPublicBarberReviews,
  getPublicShopReviews,
  PublicShopReview,
} from '@/lib/shops';

export function ShopReviewsDrawer({
  open,
  shopId,
  shopName,
  rating,
  reviewCount,
  onClose,
}: {
  open: boolean;
  shopId: string;
  shopName: string;
  rating: number;
  reviewCount: number;
  onClose: () => void;
}) {
  return <ReviewsDrawer open={open} kind="shop" shopId={shopId} subjectName={shopName} rating={rating} reviewCount={reviewCount} onClose={onClose} />;
}

export function BarberReviewsDrawer({
  open,
  shopId,
  barberId,
  barberName,
  rating,
  reviewCount,
  onClose,
}: {
  open: boolean;
  shopId: string;
  barberId: string;
  barberName: string;
  rating: number;
  reviewCount: number;
  onClose: () => void;
}) {
  return <ReviewsDrawer open={open} kind="barber" shopId={shopId} barberId={barberId} subjectName={barberName} rating={rating} reviewCount={reviewCount} onClose={onClose} />;
}

function ReviewsDrawer({
  open,
  kind,
  shopId,
  barberId,
  subjectName,
  rating,
  reviewCount,
  onClose,
}: {
  open: boolean;
  kind: 'shop' | 'barber';
  shopId: string;
  barberId?: string;
  subjectName: string;
  rating: number;
  reviewCount: number;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [reviews, setReviews] = useState<PublicShopReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError('');
    const request = kind === 'barber' && barberId
      ? getPublicBarberReviews(shopId, barberId)
      : getPublicShopReviews(shopId);
    request
      .then((response) => active && setReviews(response.reviews))
      .catch((caught: unknown) => {
        if (!active) return;
        setError(caught instanceof AuthApiError ? caught.message : 'Unable to load reviews.');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, kind, shopId, barberId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="reviews-drawer-title">
      <button type="button" aria-label="Close reviews" onClick={onClose} className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" />
      <section className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-stone-50 shadow-2xl">
        <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Customer reviews</p>
              <h2 id="reviews-drawer-title" className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{subjectName}</h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-slate-600">
                <Star className="size-4 fill-amber-400 text-amber-400" /> {rating} from {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close reviews" className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
              <X className="size-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {loading ? (
            <div className="grid min-h-64 place-items-center text-sm font-bold text-slate-500"><span className="flex items-center gap-2"><LoaderCircle className="size-5 animate-spin text-emerald-600" /> Loading reviews…</span></div>
          ) : error ? (
            <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><Star className="mx-auto size-8 text-slate-300" /><h3 className="mt-3 font-extrabold text-slate-900">No reviews yet</h3><p className="mt-1 text-sm text-slate-500">Be the first customer to review this {kind}.</p></div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ReviewCard({ review }: { review: PublicShopReview }) {
  const initial = review.customer.name.trim().slice(0, 1).toUpperCase() || 'C';
  const date = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(review.createdAt));

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {review.customer.avatar ? (
            // Customer avatars may be hosted by any configured CDN.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={review.customer.avatar} alt="" className="size-10 rounded-full object-cover" />
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800">{initial}</span>
          )}
          <div className="min-w-0"><h3 className="truncate font-extrabold text-slate-900">{review.customer.name}</h3><p className="text-xs text-slate-400">{date}</p></div>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-extrabold text-amber-700"><Star className="size-3.5 fill-current" /> {review.rating}</span>
      </div>
      {review.comment ? <p className="mt-4 text-sm leading-6 text-slate-600">{review.comment}</p> : <p className="mt-4 text-sm italic text-slate-400">Rating only</p>}
      {review.barberName && <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">Appointment with <span className="text-slate-700">{review.barberName}</span></p>}
    </article>
  );
}
