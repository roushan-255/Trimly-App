'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useState } from 'react';
import { BookingDetails, BookingSummary } from '@/components/booking/booking-summary';
import { CheckoutAuthCard } from '@/components/booking/checkout-auth-card';
import { useAuth } from '@/components/auth/auth-provider';
import { AuthApiError } from '@/lib/auth';
import { createBooking } from '@/lib/shops';

function bookingFromParams(params: URLSearchParams): BookingDetails { return { shop: params.get('shop') || "The Gentleman's Chair", service: params.get('service') || 'Classic Haircut', barber: params.get('barber') || 'Arjun Mehta', date: params.get('dateLabel') || params.get('date') || 'Saturday, 2 August', time: params.get('time') || '11:30 AM', duration: params.get('duration') || undefined, price: params.get('price') || '299' }; }
export default function CheckoutPage() {
  return <Suspense fallback={<main className="min-h-screen bg-stone-50" />}><CheckoutContent /></Suspense>;
}
function CheckoutContent() {
  const params = useSearchParams(); const booking = bookingFromParams(params); const { customer, ready } = useAuth();
  if (!ready) return null;
  return <main className="min-h-screen bg-stone-50"><header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-5 py-5"><Link href="/" className="text-xl font-extrabold tracking-tight text-slate-950">← Trimly</Link></div></header><div className="mx-auto grid max-w-5xl gap-8 px-5 py-12 lg:grid-cols-[1fr_.8fr]"><div><p className="text-sm font-bold uppercase tracking-[.15em] text-emerald-700">Secure your time</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Review and confirm your booking</h1><div className="mt-7">{customer ? <ConfirmedBooking customerName={customer.firstName} params={params} /> : <CheckoutAuthCard onAuthenticated={() => window.location.reload()} />}</div></div><BookingSummary booking={booking} /></div></main>;
}
function ConfirmedBooking({ customerName, params }: { customerName: string; params: URLSearchParams }) {
  const router = useRouter();
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState('');
  const shopId = params.get('shopId') || '';
  const barberId = params.get('barberId') || '';
  const serviceIds = params.getAll('serviceId');
  const slotIds = params.getAll('slotId');

  async function confirm() {
    if (!shopId || !barberId || serviceIds.length === 0 || slotIds.length === 0) {
      setError('This booking link is missing service or slot details. Please choose a time again.');
      return;
    }
    setIsBooking(true);
    setError('');
    try {
      await createBooking({ shopId, barberId, serviceIds, slotIds });
      router.replace('/bookings?confirmed=1');
    } catch (caught: unknown) {
      setError(caught instanceof AuthApiError ? caught.message : 'Unable to confirm this booking.');
    } finally {
      setIsBooking(false);
    }
  }

  return <section className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm"><CheckCircle2 className="size-11 text-emerald-600" /><h2 className="mt-4 text-2xl font-extrabold text-slate-950">Ready to confirm, {customerName}</h2><p className="mt-2 text-slate-600">Confirming will reserve every selected 10-minute slot. Payment is not required yet.</p><button type="button" disabled={isBooking} onClick={confirm} className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{isBooking ? 'Reserving…' : 'Confirm Booking'}</button>{error && <p role="alert" className="mt-4 text-sm font-semibold text-rose-600">{error}</p>}</section>;
}
