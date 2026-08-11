'use client';

import {
  CalendarDays,
  Check,
  LoaderCircle,
  Scissors,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/marketing/navbar';
import { BarberReviewsDrawer } from '@/components/shops/shop-reviews-drawer';
import { AuthApiError } from '@/lib/auth';
import { rescheduleCustomerBooking } from '@/lib/customer';
import {
  BarberAvailability,
  getBarberAvailability,
} from '@/lib/shops';

function dateInTimezone(timeZone?: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts();
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export default function BarberAvailabilityPage() {
  const { shopId, barberId } = useParams<{
    shopId: string;
    barberId: string;
  }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const rescheduleId = searchParams.get('reschedule') || '';
  const [date, setDate] = useState(
    searchParams.get('date') || dateInTimezone(),
  );
  const [serviceIds, setServiceIds] = useState<string[]>(
    searchParams.getAll('serviceId'),
  );
  const [availability, setAvailability] =
    useState<BarberAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    getBarberAvailability(
      shopId,
      barberId,
      date,
      serviceIds.length ? serviceIds : undefined,
    )
      .then((result) => {
        if (!active) return;
        setAvailability(result);
        if (serviceIds.length === 0 && result.selectedServiceIds.length) {
          setServiceIds(result.selectedServiceIds);
        }
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          caught instanceof AuthApiError
            ? caught.message
            : 'Unable to load availability.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [shopId, barberId, date, serviceIds]);

  const selectedServices = useMemo(
    () =>
      availability?.services.filter((service) =>
        serviceIds.includes(service.id),
      ) ?? [],
    [availability, serviceIds],
  );
  const totalPrice = selectedServices.reduce(
    (total, service) => total + Number(service.price),
    0,
  );
  const shopToday = dateInTimezone(availability?.shop.timezone);

  useEffect(() => {
    if (availability && date < shopToday) setDate(shopToday);
  }, [availability, date, shopToday]);

  async function continueBooking() {
    if (!availability || selectedServices.length === 0) {
      return;
    }

    if (rescheduleId) {
      setIsSubmitting(true);
      setActionError('');
      try {
        await rescheduleCustomerBooking(rescheduleId, date);
        router.push('/bookings?rescheduled=1');
      } catch (caught: unknown) {
        if (caught instanceof AuthApiError && caught.status === 401) {
          router.push('/customer/login?returnTo=/bookings');
          return;
        }
        setActionError(
          caught instanceof AuthApiError
            ? caught.message
            : 'Unable to reschedule this booking.',
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const params = new URLSearchParams({
      shopId,
      barberId,
      shop: availability.shop.name,
      barber: availability.barber.displayName,
      service: selectedServices.map((service) => service.name).join(' + '),
      date,
      dateLabel: formatDate(date),
      price: String(totalPrice),
    });
    selectedServices.forEach((service) =>
      params.append('serviceId', service.id),
    );
    router.push(`/checkout?${params.toString()}`);
  }

  function toggleService(serviceId: string) {
    if (rescheduleId) return;
    setServiceIds((current) => {
      if (!current.includes(serviceId)) return [...current, serviceId];
      if (current.length === 1) return current;
      return current.filter((id) => id !== serviceId);
    });
  }

  if (loading && !availability) {
    return (
      <main className="min-h-screen bg-stone-50">
        <Navbar />
        <div className="grid min-h-[65vh] place-items-center text-sm font-bold text-slate-500">
          <span className="flex items-center gap-2">
            <LoaderCircle className="size-5 animate-spin" />
            Loading availability…
          </span>
        </div>
      </main>
    );
  }

  if (!availability || error) {
    return (
      <main className="min-h-screen bg-stone-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-5 py-24 text-center">
          <h1 className="text-3xl font-extrabold text-slate-950">
            Barber not available
          </h1>
          <p className="mt-3 text-slate-500">
            {error || 'This barber is not available at this shop.'}
          </p>
          <Link
            className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white"
            href={`/shops/${shopId}`}
          >
            Back to shop
          </Link>
        </div>
      </main>
    );
  }

  const { barber, shop } = availability;

  return (
    <main className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <Link
          href={`/shops/${shopId}`}
          className="text-sm font-bold text-emerald-700"
        >
          ← {shop.name}
        </Link>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {barber.profileImageUrl ? (
              // Profile URLs are stored by the application and may use any CDN.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={barber.profileImageUrl}
                alt={barber.displayName}
                className="size-24 rounded-3xl object-cover"
              />
            ) : (
              <div className="grid size-24 place-items-center rounded-3xl bg-[#0d2231] text-3xl font-extrabold text-emerald-200">
                {barber.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-bold uppercase tracking-[.14em] text-emerald-700">
                Book with
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">
                {barber.displayName}
              </h1>
              {barber.rating !== null && (
                <button type="button" onClick={() => setReviewsOpen(true)} className="group relative isolate mt-2 flex items-center gap-1 px-1 py-1 text-sm font-bold text-amber-600 transition-colors duration-200 before:pointer-events-none before:absolute before:-inset-x-1 before:-inset-y-1 before:-z-10 before:rounded-full before:bg-amber-200/0 before:blur-sm before:transition-colors before:duration-200 hover:text-amber-700 hover:before:bg-amber-200/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
                  <Star className="size-4 fill-current transition-transform duration-200 group-hover:scale-110" /> {barber.rating} ·{' '}
                  {barber.reviewCount} reviews
                </button>
              )}
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                {barber.bio || 'Barber at this Trimly location.'}
              </p>
            </div>
          </div>
          {barber.specialties.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {barber.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
                >
                  {specialty}
                </span>
              ))}
            </div>
          )}
        </section>

        {rescheduleId && (
          <p className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-800">
            Choose a new visit date. Your original booking remains unchanged until the update succeeds.
          </p>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_.34fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950">
                  Choose your visit date
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  No arrival time is required. This lets the shop and barber know you plan to visit that day.
                </p>
              </div>
              <label className="text-sm font-bold text-slate-700">
                Date
                <input
                  type="date"
                  min={shopToday}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-1 block rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-600"
                />
              </label>
            </div>

            {availability.services.length > 0 ? (
              <fieldset className="mt-6">
                <legend className="text-sm font-bold text-slate-700">
                  Services
                </legend>
                <p className="mt-1 text-xs text-slate-500">
                  Select one or more services for your visit.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {availability.services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      disabled={Boolean(rescheduleId)}
                      aria-pressed={serviceIds.includes(service.id)}
                      onClick={() => toggleService(service.id)}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition disabled:cursor-not-allowed ${
                        serviceIds.includes(service.id)
                          ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-extrabold text-slate-900">
                          {service.name}
                        </span>
                        <span className="mt-1 block text-xs font-semibold text-slate-500">
                          ₹{service.price}
                        </span>
                      </span>
                      <span
                        className={`grid size-6 shrink-0 place-items-center rounded-full border ${
                          serviceIds.includes(service.id)
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 text-transparent'
                        }`}
                      >
                        <Check className="size-4" />
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : (
              <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                This barber does not have any active services yet.
              </p>
            )}

            <p className="mt-7 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900">
              <CalendarDays className="mt-0.5 size-5 shrink-0" />
              Your booking is a visit notice for <strong>{formatDate(date)}</strong>. The shop and barber will know you are coming; you can arrive at a convenient time during their business hours.
            </p>
          </section>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <Scissors className="size-6 text-emerald-600" />
            <h2 className="mt-4 text-xl font-extrabold text-slate-950">
              Your selection
            </h2>
            {selectedServices.length > 0 ? (
              <div className="mt-4">
                <div className="space-y-2">
                  {selectedServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <span className="font-bold text-slate-900">
                        {service.name}
                      </span>
                      <span className="shrink-0 text-slate-500">
                        ₹{service.price}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-slate-100 pt-3 text-sm font-bold text-slate-600">
                  {selectedServices.length} service
                  {selectedServices.length === 1 ? '' : 's'} ·{' '}
                  ₹{totalPrice}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Choose at least one service.
              </p>
            )}
            <p className="mt-5 flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
              <CalendarDays className="size-4 shrink-0" /> {formatDate(date)} · Flexible arrival
            </p>
            <button
              type="button"
              disabled={selectedServices.length === 0 || isSubmitting}
              onClick={() => void continueBooking()}
              className="mt-7 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting
                ? 'Rescheduling…'
                : rescheduleId
                  ? 'Confirm new date'
                  : 'Book visit'}
            </button>
            {actionError && (
              <p role="alert" className="mt-3 text-center text-xs font-semibold text-rose-600">
                {actionError}
              </p>
            )}
            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              {rescheduleId
                ? 'Your old date changes only after this update is confirmed.'
                : 'This sends a visit notice to the shop and barber.'}
            </p>
          </aside>
        </div>
      </div>
      {barber.rating !== null && (
        <BarberReviewsDrawer open={reviewsOpen} shopId={shopId} barberId={barber.id} barberName={barber.displayName} rating={barber.rating} reviewCount={barber.reviewCount} onClose={() => setReviewsOpen(false)} />
      )}
    </main>
  );
}
