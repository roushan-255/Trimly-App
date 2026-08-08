'use client';

import { CalendarDays, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useRef, useState } from 'react';
import { LocationAutocomplete } from './location-autocomplete';

function today() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function ShopSearchForm() {
  const router = useRouter();
  const dateInput = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(today);
  const [error, setError] = useState('');

  const openDatePicker = () => {
    const input = dateInput.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') input.showPicker();
    else input.focus();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!location.trim()) {
      setError('Choose a location from the suggestions.');
      return;
    }
    if (!date) {
      setError('Choose an appointment date.');
      return;
    }

    setError('');
    const params = new URLSearchParams({
      location: location.trim(),
      date,
      sort: 'rating',
    });
    router.push(`/shops?${params.toString()}`);
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 sm:p-4"
      noValidate
    >
      <div className="grid gap-2 lg:grid-cols-[1.35fr_.9fr_auto]">
        <LocationAutocomplete
          value={location}
          onChange={setLocation}
          variant="hero"
          required
        />
        <div className="group relative flex min-h-16 items-center gap-3 rounded-xl border-t border-slate-100 px-3 transition focus-within:bg-emerald-50 lg:border-l lg:border-t-0">
          <button
            type="button"
            onClick={openDatePicker}
            aria-label="Open appointment date picker"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-emerald-600 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <CalendarDays className="size-7" />
          </button>
          <span className="min-w-0 flex-1">
            <span className="mb-1 block text-xs font-bold text-slate-900">
              Appointment date
            </span>
            <input
              ref={dateInput}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              type="date"
              min={today()}
              aria-label="Select appointment date"
              className="home-date-input w-full bg-transparent text-sm text-slate-700 outline-none"
              required
            />
          </span>
        </div>
        <button
          type="submit"
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          <Search className="size-4" /> Find shops
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 px-3 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </form>
  );
}
