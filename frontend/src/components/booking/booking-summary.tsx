import { CalendarDays, Scissors, UserRound } from 'lucide-react';

export type BookingDetails = { shop: string; service: string; barber: string; date: string; price: string };
export function BookingSummary({ booking }: { booking: BookingDetails }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-extrabold text-slate-950">Your visit</h2><div className="mt-5 space-y-4 text-sm"><div className="border-b border-slate-100 pb-4"><p className="font-extrabold text-slate-900">{booking.shop}</p><p className="mt-1 text-slate-500">{booking.service}</p></div><p className="flex items-center gap-3 text-slate-600"><UserRound className="size-4 text-emerald-600" /> {booking.barber}</p><p className="flex items-center gap-3 text-slate-600"><CalendarDays className="size-4 text-emerald-600" /> {booking.date} · Flexible arrival</p><p className="flex items-center justify-between border-t border-slate-100 pt-4 font-bold text-slate-900"><span className="flex items-center gap-2"><Scissors className="size-4 text-emerald-600" /> Total</span><span className="text-lg">₹{booking.price}</span></p></div></section>;
}
