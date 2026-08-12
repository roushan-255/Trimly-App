'use client';

import { CheckCircle2, LoaderCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { BookingDetails, BookingSummary } from '@/components/booking/booking-summary';
import { CheckoutAuthCard } from '@/components/booking/checkout-auth-card';
import { AuthApiError } from '@/lib/auth';
import { createBooking } from '@/lib/shops';

interface InlineBookingModalProps {
  open: boolean;
  onClose: () => void;
  shopId: string;
  barberId: string;
  serviceIds: string[];
  date: string;
  booking: BookingDetails;
}

export function InlineBookingModal({
  open,
  onClose,
  shopId,
  barberId,
  serviceIds,
  date,
  booking,
}: InlineBookingModalProps) {
  const router = useRouter();
  const { customer, ready } = useAuth();
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBooking) onClose();
    };
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isBooking, onClose, open]);

  useEffect(() => {
    if (customer) setError('');
  }, [customer]);

  if (!open) return null;

  async function confirmBooking() {
    setIsBooking(true);
    setError('');
    try {
      await createBooking({ shopId, barberId, serviceIds, date });
      router.replace('/bookings?confirmed=1');
    } catch (caught: unknown) {
      setError(
        caught instanceof AuthApiError
          ? caught.message
          : 'Unable to confirm this visit.',
      );
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBooking) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/60 bg-stone-50 shadow-2xl shadow-slate-950/25"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isBooking}
          aria-label="Close booking window"
          className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-sm transition hover:rotate-90 hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="size-5" />
        </button>

        {!ready ? (
          <div className="grid min-h-80 place-items-center">
            <LoaderCircle className="size-7 animate-spin text-emerald-600" />
          </div>
        ) : customer ? (
          <div className="p-6 sm:p-8 lg:p-10">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">
                Final step
              </p>
              <h2
                id="booking-modal-title"
                className="mt-2 max-w-md text-3xl font-extrabold tracking-tight text-slate-950"
              >
                Review and confirm your visit
              </h2>
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <CheckCircle2 className="size-8 text-emerald-600" />
                <p className="mt-3 font-extrabold text-slate-950">
                  Ready, {customer.firstName}?
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  This sends a visit notice to the shop and barber. You can
                  arrive at a convenient time during business hours.
                </p>
              </div>
              <div className="mt-5">
                <BookingSummary booking={booking} />
              </div>
              <button
                type="button"
                disabled={isBooking}
                onClick={() => void confirmBooking()}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBooking && <LoaderCircle className="size-4 animate-spin" />}
                {isBooking ? 'Sending visit notice…' : 'Confirm booking'}
              </button>
              {error && (
                <p
                  role="alert"
                  className="mt-3 text-center text-sm font-semibold text-rose-600"
                >
                  {error}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 lg:p-10">
            <div>
              <p className="pr-12 text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">
                Continue your booking
              </p>
              <h2 id="booking-modal-title" className="sr-only">
                Log in or sign up to continue
              </h2>
              <div className="mt-4">
                <CheckoutAuthCard onAuthenticated={() => setError('')} />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
