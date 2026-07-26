'use client';

import { CalendarDays, LocateFixed, MapPin, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function ShopSearchForm() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!location.trim() && !query.trim()) { setError('Add a location or a shop, service, or amenity to search.'); return; }
    setError('');
    const params = new URLSearchParams();
    if (location.trim()) params.set('location', location.trim());
    if (query.trim()) params.set('query', query.trim());
    if (date) params.set('date', date);
    router.push(`/shops?${params.toString()}`);
  };
  return <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 sm:p-4" noValidate>
    <div className="grid gap-2 lg:grid-cols-[1.2fr_1.1fr_.8fr_auto]">
      <label className="group relative flex min-h-16 items-center gap-3 rounded-xl px-3 transition focus-within:bg-emerald-50"><MapPin className="size-5 shrink-0 text-emerald-600" /><span className="min-w-0 flex-1"><span className="mb-1 block text-xs font-bold text-slate-900">Location</span><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Search city, locality or area" className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" /></span></label>
      <label className="group relative flex min-h-16 items-center gap-3 rounded-xl border-t border-slate-100 px-3 transition focus-within:bg-emerald-50 lg:border-l lg:border-t-0"><Search className="size-5 shrink-0 text-emerald-600" /><span className="min-w-0 flex-1"><span className="mb-1 block text-xs font-bold text-slate-900">What are you looking for?</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search shop, service or amenity" className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" /></span></label>
      <label className="group relative flex min-h-16 items-center gap-3 rounded-xl border-t border-slate-100 px-3 transition focus-within:bg-emerald-50 lg:border-l lg:border-t-0"><CalendarDays className="size-5 shrink-0 text-emerald-600" /><span className="min-w-0 flex-1"><span className="mb-1 block text-xs font-bold text-slate-900">Date</span><input value={date} onChange={(e) => setDate(e.target.value)} type="date" aria-label="Select date" className="w-full bg-transparent text-sm text-slate-700 outline-none" /></span></label>
      <button type="submit" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"><Search className="size-4" /> Search</button>
    </div>
    <div className="mt-2 flex items-center justify-between px-3"><button type="button" onClick={() => setLocation('Current location')} className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><LocateFixed className="size-3.5" /> Use Current Location</button>{error && <p role="alert" className="text-xs font-medium text-rose-600">{error}</p>}</div>
  </form>;
}
