'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { BookingDetails, BookingSummary } from '@/components/booking/booking-summary';
import { CheckoutAuthCard } from '@/components/booking/checkout-auth-card';
import { useAuth } from '@/components/auth/auth-provider';

function bookingFromParams(params: URLSearchParams): BookingDetails { return { shop: params.get('shop') || "The Gentleman's Chair", service: params.get('service') || 'Classic Haircut', barber: params.get('barber') || 'Arjun Mehta', date: params.get('date') || 'Saturday, 2 August', time: params.get('time') || '11:30 AM', price: params.get('price') || '299' }; }
export default function CheckoutPage() {
  return <Suspense fallback={<main className="min-h-screen bg-stone-50" />}><CheckoutContent /></Suspense>;
}
function CheckoutContent() {
  const params = useSearchParams(); const booking = bookingFromParams(params); const { customer, ready } = useAuth();
  if (!ready) return null;
  return <main className="min-h-screen bg-stone-50"><header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-5 py-5"><Link href="/" className="text-xl font-extrabold tracking-tight text-slate-950">← Trimly</Link></div></header><div className="mx-auto grid max-w-5xl gap-8 px-5 py-12 lg:grid-cols-[1fr_.8fr]"><div><p className="text-sm font-bold uppercase tracking-[.15em] text-emerald-700">Secure your time</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Review and confirm your booking</h1><div className="mt-7">{customer ? <ConfirmedBooking customerName={customer.firstName} /> : <CheckoutAuthCard onAuthenticated={() => window.location.reload()} />}</div></div><BookingSummary booking={booking} /></div></main>;
}
function ConfirmedBooking({ customerName }: { customerName: string }) { return <section className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm"><CheckCircle2 className="size-11 text-emerald-600" /><h2 className="mt-4 text-2xl font-extrabold text-slate-950">Ready to confirm, {customerName}</h2><p className="mt-2 text-slate-600">Your appointment details are saved. Confirm your booking when payment is connected.</p><button type="button" onClick={() => alert('Booking confirmed! A confirmation will be sent shortly.')} className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700">Confirm Booking</button></section>; }
