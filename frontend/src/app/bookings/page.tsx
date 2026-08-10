'use client';

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  RotateCcw,
  Scissors,
  Star,
  Store,
  UserRound,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Navbar } from '@/components/marketing/navbar';
import { AuthApiError, readAuthSession } from '@/lib/auth';
import {
  AppointmentStatus,
  cancelCustomerBooking,
  BookingReview,
  CustomerBooking,
  CustomerBookingsResponse,
  getCustomerBookings,
  submitCustomerBookingReview,
} from '@/lib/customer';

const statusLabels: Record<AppointmentStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
};

const statusStyles: Record<AppointmentStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  COMPLETED: 'bg-blue-50 text-blue-800 ring-blue-200',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-200',
  NO_SHOW: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export default function BookingsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-stone-50" />}>
      <BookingsContent />
    </Suspense>
  );
}

function BookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<CustomerBookingsResponse>({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmCancelId, setConfirmCancelId] = useState('');
  const [cancellingId, setCancellingId] = useState('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBookings(await getCustomerBookings());
    } catch (caught: unknown) {
      if (caught instanceof AuthApiError && caught.status === 401) {
        router.replace('/customer/login?returnTo=/bookings');
        return;
      }
      setError(caught instanceof AuthApiError ? caught.message : 'Unable to load your bookings.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const session = readAuthSession();
    if (!session || session.user.role !== 'CUSTOMER') {
      router.replace('/customer/login?returnTo=/bookings');
      return;
    }
    void loadBookings();
  }, [loadBookings, router]);

  async function cancelBooking(bookingId: string) {
    setCancellingId(bookingId);
    setError('');
    try {
      await cancelCustomerBooking(bookingId);
      setConfirmCancelId('');
      setTab('past');
      await loadBookings();
    } catch (caught: unknown) {
      setError(caught instanceof AuthApiError ? caught.message : 'Unable to cancel this booking.');
    } finally {
      setCancellingId('');
    }
  }

  function storeSubmittedReview(bookingId: string, review: BookingReview) {
    setBookings((current) => ({
      upcoming: current.upcoming.map((booking) =>
        booking.id === bookingId ? { ...booking, review } : booking,
      ),
      past: current.past.map((booking) =>
        booking.id === bookingId ? { ...booking, review } : booking,
      ),
    }));
  }

  const visibleBookings = bookings[tab];

  return (
    <main className="min-h-screen bg-stone-50 text-slate-950">
      <Navbar />
      <section className="border-b border-slate-200 bg-[#0d2231] text-white">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-sm font-bold uppercase tracking-[.16em] text-emerald-200">Your Trimly account</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-.045em] sm:text-5xl">My bookings</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Review your appointments, choose a new time, or cancel before the appointment begins.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {searchParams.get('rescheduled') === '1' && (
          <p className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
            <CheckCircle2 className="size-5" /> Your booking has been rescheduled.
          </p>
        )}
        {error && (
          <p role="alert" className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
            {error}
          </p>
        )}

        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm" role="tablist" aria-label="Booking history">
          {(['upcoming', 'past'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`rounded-xl px-5 py-2.5 text-sm font-extrabold capitalize transition ${tab === value ? 'bg-[#0d2231] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {value} <span className="ml-1 opacity-70">({bookings[value].length})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid min-h-80 place-items-center text-sm font-bold text-slate-500">
            <span className="flex items-center gap-2"><LoaderCircle className="size-5 animate-spin text-emerald-600" /> Loading your bookings…</span>
          </div>
        ) : visibleBookings.length === 0 ? (
          <EmptyBookings tab={tab} />
        ) : (
          <div className="mt-7 grid gap-5">
            {visibleBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                confirming={confirmCancelId === booking.id}
                cancelling={cancellingId === booking.id}
                onAskCancel={() => setConfirmCancelId(booking.id)}
                onKeep={() => setConfirmCancelId('')}
                onCancel={() => void cancelBooking(booking.id)}
                onReviewed={(review) => storeSubmittedReview(booking.id, review)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function BookingCard({ booking, confirming, cancelling, onAskCancel, onKeep, onCancel, onReviewed }: {
  booking: CustomerBooking;
  confirming: boolean;
  cancelling: boolean;
  onAskCancel: () => void;
  onKeep: () => void;
  onCancel: () => void;
  onReviewed: (review: BookingReview) => void;
}) {
  const [review, setReview] = useState<BookingReview | null>(booking.review);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const startsAt = new Date(booking.startsAt);
  const endsAt = new Date(booking.endsAt);
  const date = new Intl.DateTimeFormat('en-IN', {
    timeZone: booking.shop.timezone,
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  }).format(startsAt);
  const time = new Intl.DateTimeFormat('en-IN', {
    timeZone: booking.shop.timezone,
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(startsAt);
  const endTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: booking.shop.timezone,
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(endsAt);
  const address = [booking.shop.addressLine1, booking.shop.locality, booking.shop.city, booking.shop.state]
    .filter(Boolean)
    .join(', ');
  const selection = new URLSearchParams();
  selection.set('date', dateInputValue(startsAt, booking.shop.timezone));
  booking.services.forEach((service) => selection.append('serviceId', service.id));
  const barberUrl = `/shops/${booking.shop.id}/barbers/${booking.barber.id}`;
  const rescheduleUrl = `${barberUrl}?reschedule=${booking.id}&${selection.toString()}`;
  const bookAgainUrl = `${barberUrl}?${selection.toString()}`;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid md:grid-cols-[180px_1fr]">
        <div className="flex items-center gap-4 bg-emerald-50 p-5 md:flex-col md:items-start md:justify-center md:p-7">
          <span className="grid size-12 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm"><CalendarDays className="size-6" /></span>
          <div><p className="font-extrabold text-slate-950">{date}</p><p className="mt-1 text-sm font-bold text-emerald-800">{time} – {endTime}</p></div>
        </div>
        <div className="p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">{booking.shop.name}</h2>
              <p className="mt-2 flex items-start gap-2 text-sm leading-5 text-slate-500"><MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" /> {address}</p>
            </div>
            <span className={`self-start rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset ${statusStyles[booking.status]}`}>{statusLabels[booking.status]}</span>
          </div>

          <div className="mt-6 grid gap-5 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-[.75fr_1.6fr_.6fr_.6fr]">
            <p className="flex items-center gap-2"><UserRound className="size-4 text-emerald-600" /><span><span className="block text-xs text-slate-400">Barber</span><strong className="text-slate-800">{booking.barber.displayName}</strong></span></p>
            <div className="flex items-start gap-2">
              <Scissors className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <div className="min-w-0 flex-1">
                <span className="block text-xs text-slate-400">Services</span>
                <ul className="mt-1 space-y-1.5">
                  {booking.services.map((service) => (
                    <li key={service.id} className="flex items-start justify-between gap-3 font-bold text-slate-800">
                      <span>{service.name}</span>
                      <span className="shrink-0 text-slate-600">₹{formatPrice(service.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="flex items-center gap-2"><Clock3 className="size-4 text-emerald-600" /><span><span className="block text-xs text-slate-400">Duration</span><strong className="text-slate-800">{booking.durationMin} min</strong></span></p>
            <p className="flex items-center gap-2"><span className="text-lg font-extrabold text-emerald-600">₹</span><span><span className="block text-xs text-slate-400">Total price</span><strong className="text-slate-800">₹{formatPrice(booking.totalPrice)}</strong></span></p>
          </div>

          {confirming ? (
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-rose-800">Cancel this complete booking and release its time slots?</p>
              <div className="flex gap-2">
                <button type="button" disabled={cancelling} onClick={onKeep} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">Keep booking</button>
                <button type="button" disabled={cancelling} onClick={onCancel} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{cancelling && <LoaderCircle className="size-4 animate-spin" />} Confirm cancellation</button>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              <Link href={`/shops/${booking.shop.id}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><Store className="size-4" /> View shop</Link>
              {booking.canReschedule && <Link href={rescheduleUrl} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"><RotateCcw className="size-4" /> Reschedule</Link>}
              {booking.canCancel && <button type="button" onClick={onAskCancel} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50"><XCircle className="size-4" /> Cancel booking</button>}
              {!booking.isUpcoming && <Link href={bookAgainUrl} className="inline-flex items-center gap-2 rounded-xl bg-[#0d2231] px-4 py-2.5 text-sm font-bold text-white"><RotateCcw className="size-4" /> Book again</Link>}
              {booking.status === 'COMPLETED' && !review && (
                <button type="button" onClick={() => setShowReviewForm((current) => !current)} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 hover:bg-amber-100">
                  <Star className="size-4" /> {showReviewForm ? 'Close review' : 'Write a review'}
                </button>
              )}
            </div>
          )}
          {booking.status === 'COMPLETED' && review && (
            <SubmittedReview review={review} shopName={booking.shop.name} barberName={booking.barber.displayName} />
          )}
          {booking.status === 'COMPLETED' && !review && showReviewForm && (
            <BookingReviewForm
              booking={booking}
              onSubmitted={(submitted) => {
                setReview(submitted);
                onReviewed(submitted);
                setShowReviewForm(false);
              }}
            />
          )}
        </div>
      </div>
    </article>
  );
}

function BookingReviewForm({ booking, onSubmitted }: {
  booking: CustomerBooking;
  onSubmitted: (review: BookingReview) => void;
}) {
  const [shopRating, setShopRating] = useState(0);
  const [barberRating, setBarberRating] = useState(0);
  const [shopComment, setShopComment] = useState('');
  const [barberComment, setBarberComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shopRating || !barberRating) {
      setError('Choose a rating for both the shop and your barber.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const review = await submitCustomerBookingReview(booking.id, {
        shopRating,
        barberRating,
        ...(shopComment.trim() && { shopComment: shopComment.trim() }),
        ...(barberComment.trim() && { barberComment: barberComment.trim() }),
      });
      onSubmitted(review);
    } catch (caught: unknown) {
      setError(caught instanceof AuthApiError ? caught.message : 'Unable to submit your review.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
          <Star className="size-5 fill-current" />
        </span>
        <div>
          <h3 className="text-base font-extrabold text-slate-950">Rate your visit</h3>
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ReviewField
          title={`Rate ${booking.shop.name}`}
          rating={shopRating}
          onRating={setShopRating}
          comment={shopComment}
          onComment={setShopComment}
          placeholder="Tell others about the shop, cleanliness, or service…"
        />
        <ReviewField
          title={`Rate ${booking.barber.displayName}`}
          rating={barberRating}
          onRating={setBarberRating}
          comment={barberComment}
          onComment={setBarberComment}
          placeholder="Tell others about your barber and the result…"
        />
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}
      <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-slate-400">Both star ratings are required. Comments are optional.</p>
        <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:w-auto">
          {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Star className="size-4" />}
          {submitting ? 'Submitting…' : 'Submit reviews'}
        </button>
      </div>
    </form>
  );
}

function ReviewField({ title, rating, onRating, comment, onComment, placeholder }: {
  title: string;
  rating: number;
  onRating: (rating: number) => void;
  comment: string;
  onComment: (comment: string) => void;
  placeholder: string;
}) {
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[.02]">
      <legend className="px-1 text-sm font-extrabold text-slate-900">{title}</legend>
      <div className="mt-2 flex gap-0.5" aria-label={`${title}: ${rating || 'not rated'}`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" onClick={() => onRating(value)} aria-label={`${value} star${value === 1 ? '' : 's'}`} className="rounded-md p-1 text-amber-400 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
            <Star className={`size-6 ${value <= rating ? 'fill-current' : 'fill-transparent text-slate-300'}`} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(event) => onComment(event.target.value)} maxLength={1000} placeholder={placeholder} aria-label={`${title} comment`} className="mt-3 min-h-20 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-5 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100" />
    </fieldset>
  );
}

function SubmittedReview({ review, shopName, barberName }: {
  review: BookingReview;
  shopName: string;
  barberName: string;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
      <div className="flex items-center gap-2 font-extrabold text-emerald-900"><CheckCircle2 className="size-5" /> Review submitted</div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ReviewSummary title={shopName} rating={review.shopRating} comment={review.shopComment} />
        <ReviewSummary title={barberName} rating={review.barberRating} comment={review.barberComment} />
      </div>
    </section>
  );
}

function ReviewSummary({ title, rating, comment }: { title: string; rating: number; comment: string | null }) {
  return (
    <div className="rounded-xl bg-white p-4">
      <p className="text-sm font-extrabold text-slate-900">{title}</p>
      <p className="mt-2 flex gap-0.5 text-amber-400" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((value) => <Star key={value} className={`size-4 ${value <= rating ? 'fill-current' : 'fill-transparent text-slate-300'}`} />)}
      </p>
      {comment && <p className="mt-2 text-sm leading-6 text-slate-600">{comment}</p>}
    </div>
  );
}

function EmptyBookings({ tab }: { tab: 'upcoming' | 'past' }) {
  return (
    <section className="mt-7 grid min-h-80 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div><CalendarDays className="mx-auto size-10 text-emerald-600" /><h2 className="mt-4 text-xl font-extrabold">No {tab} bookings</h2><p className="mt-2 text-sm text-slate-500">{tab === 'upcoming' ? 'Find a nearby shop and reserve your next appointment.' : 'Completed and cancelled bookings will appear here.'}</p>{tab === 'upcoming' && <Link href="/shops" className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white">Explore shops</Link>}</div>
    </section>
  );
}

function dateInputValue(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatPrice(value: string) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}
