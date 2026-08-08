'use client';

import {
  CalendarDays,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  Store,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AuthApiError } from '@/lib/auth';
import {
  getPublicShops,
  getServiceOptions,
  ShopSearchParams,
  ShopSearchResponse,
  ShopSort,
} from '@/lib/shops';
import { LocationAutocomplete } from './location-autocomplete';
import { ShopCard } from './shop-card';

type FilterForm = {
  location: string;
  date: string;
  name: string;
  services: string[];
  minPrice: string;
  maxPrice: string;
  sort: ShopSort;
};

function formFromParams(params: URLSearchParams): FilterForm {
  return {
    location: params.get('location') ?? '',
    date: params.get('date') ?? '',
    name: params.get('name') ?? '',
    services: params.getAll('service'),
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    sort: (params.get('sort') as ShopSort | null) ?? 'rating',
  };
}

function requestFromParams(params: URLSearchParams): ShopSearchParams {
  const number = (key: string) => {
    const value = params.get(key);
    return value ? Number(value) : undefined;
  };

  return {
    location: params.get('location') ?? undefined,
    date: params.get('date') ?? undefined,
    name: params.get('name') ?? undefined,
    services: params.getAll('service'),
    minPrice: number('minPrice'),
    maxPrice: number('maxPrice'),
    sort: (params.get('sort') as ShopSort | null) ?? 'rating',
    page: number('page') ?? 1,
    limit: 12,
  };
}

function displayDate(date?: string) {
  if (!date) return null;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function today() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function ShopDirectory() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serializedParams = searchParams.toString();
  const applied = useMemo(
    () => requestFromParams(new URLSearchParams(serializedParams)),
    [serializedParams],
  );
  const [form, setForm] = useState<FilterForm>(() =>
    formFromParams(new URLSearchParams(serializedParams)),
  );
  const [result, setResult] = useState<ShopSearchResponse | null>(null);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setForm(formFromParams(new URLSearchParams(serializedParams)));
  }, [serializedParams]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');
    getPublicShops(applied)
      .then((response) => active && setResult(response))
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          caught instanceof AuthApiError
            ? caught.message
            : 'Unable to load shops right now.',
        );
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [applied]);

  useEffect(() => {
    let active = true;
    getServiceOptions(applied.location)
      .then((services) => active && setServiceOptions(services))
      .catch(() => active && setServiceOptions([]));
    return () => {
      active = false;
    };
  }, [applied.location]);

  const updateForm = <Key extends keyof FilterForm>(
    key: Key,
    value: FilterForm[Key],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const minPrice = form.minPrice ? Number(form.minPrice) : undefined;
    const maxPrice = form.maxPrice ? Number(form.maxPrice) : undefined;
    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      setFormError('Minimum price cannot be greater than maximum price.');
      return;
    }

    setFormError('');
    const params = new URLSearchParams();
    if (form.location.trim()) params.set('location', form.location.trim());
    if (form.date) params.set('date', form.date);
    if (form.name.trim()) params.set('name', form.name.trim());
    form.services.forEach((service) => params.append('service', service));
    if (minPrice !== undefined) params.set('minPrice', String(minPrice));
    if (maxPrice !== undefined) params.set('maxPrice', String(maxPrice));
    params.set('sort', form.sort);
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (applied.location) params.set('location', applied.location);
    if (applied.date) params.set('date', applied.date);
    params.set('sort', 'rating');
    router.push(`${pathname}?${params.toString()}`);
  };

  const changePage = (page: number) => {
    const params = new URLSearchParams(serializedParams);
    if (page <= 1) params.delete('page');
    else params.set('page', String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleService = (service: string) => {
    updateForm(
      'services',
      form.services.includes(service)
        ? form.services.filter((selected) => selected !== service)
        : [...form.services, service],
    );
  };

  const selectedDate = displayDate(applied.date);

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
      <p className="text-sm font-bold uppercase tracking-[.16em] text-emerald-700">
        Find your appointment
      </p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950">
        {applied.location
          ? `Barber shops near ${applied.location.split(',')[0]}`
          : 'Explore barber shops'}
      </h1>
      <p className="mt-3 text-slate-600">
        {selectedDate
          ? `Showing shops with availability on ${selectedDate}.`
          : 'Compare shops, services, prices, and customer ratings.'}
      </p>

      <form onSubmit={applyFilters} className="mt-8">
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_.72fr_1fr_auto] md:items-end">
          <LocationAutocomplete
            value={form.location}
            onChange={(value) => updateForm('location', value)}
          />
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Date
            <span className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-3 size-4 text-emerald-600" />
              <input
                type="date"
                min={today()}
                value={form.date}
                onChange={(event) => updateForm('date', event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 font-medium outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </span>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Shop name
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-emerald-600" />
              <input
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                placeholder="Search a shop"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 font-medium outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </span>
          </label>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0d2231] px-5 text-sm font-bold text-white hover:bg-[#173b4c]"
          >
            <Search className="size-4" /> Search
          </button>
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="flex items-center gap-2 font-extrabold text-slate-950">
              <SlidersHorizontal className="size-4 text-emerald-600" /> Filters
            </h2>

            <fieldset className="mt-6 border-t border-slate-100 pt-5">
              <legend className="text-sm font-extrabold text-slate-900">Services</legend>
              <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
                {serviceOptions.length ? (
                  serviceOptions.map((service) => (
                    <label key={service} className="flex items-start gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={form.services.includes(service)}
                        onChange={() => toggleService(service)}
                        className="mt-0.5 size-4 accent-emerald-600"
                      />
                      {service}
                    </label>
                  ))
                ) : (
                  <p className="text-xs leading-5 text-slate-400">No service options available.</p>
                )}
              </div>
            </fieldset>

            <fieldset className="mt-6 border-t border-slate-100 pt-5">
              <legend className="text-sm font-extrabold text-slate-900">Service price</legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  value={form.minPrice}
                  onChange={(event) => updateForm('minPrice', event.target.value)}
                  placeholder="Min ₹"
                  aria-label="Minimum service price"
                  className="h-10 min-w-0 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-emerald-600"
                />
                <input
                  type="number"
                  min="0"
                  value={form.maxPrice}
                  onChange={(event) => updateForm('maxPrice', event.target.value)}
                  placeholder="Max ₹"
                  aria-label="Maximum service price"
                  className="h-10 min-w-0 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>
            </fieldset>

            <label className="mt-6 grid gap-2 border-t border-slate-100 pt-5 text-sm font-extrabold text-slate-900">
              Sort results
              <select
                value={form.sort}
                onChange={(event) => updateForm('sort', event.target.value as ShopSort)}
                className="h-10 rounded-lg border border-slate-300 bg-white px-2 font-medium text-slate-700 outline-none focus:border-emerald-600"
              >
                <option value="rating">Highest rated</option>
                <option value="price_low">Price: low to high</option>
                <option value="price_high">Price: high to low</option>
                <option value="newest">Newest shops</option>
              </select>
            </label>

            {formError && (
              <p role="alert" className="mt-4 text-xs font-semibold text-rose-600">
                {formError}
              </p>
            )}

            <div className="mt-6 grid gap-2">
              <button
                type="submit"
                className="h-10 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700"
              >
                Apply filters
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100"
              >
                Clear filters
              </button>
            </div>
          </aside>

          <div>
            {isLoading ? (
              <div className="grid min-h-64 place-items-center rounded-2xl border border-slate-200 bg-white">
                <div className="text-center text-sm font-semibold text-slate-500">
                  <LoaderCircle className="mx-auto mb-3 size-6 animate-spin text-emerald-600" />
                  Finding available shops…
                </div>
              </div>
            ) : error ? (
              <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
                {error}
              </p>
            ) : !result?.items.length ? (
              <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div>
                  <Store className="mx-auto size-8 text-emerald-600" />
                  <h3 className="mt-3 font-extrabold text-slate-900">No matching shops found</h3>
                  <p className="mt-1 text-sm text-slate-500">Try another date, remove a service, or widen your price range.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <p className="text-sm font-semibold text-slate-500">
                    {result.pagination.total} {result.pagination.total === 1 ? 'shop' : 'shops'} found
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {result.items.map((shop) => <ShopCard key={shop.id} shop={shop} />)}
                </div>
                {result.pagination.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={!result.pagination.hasPreviousPage}
                      onClick={() => changePage(result.pagination.page - 1)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-semibold text-slate-500">
                      Page {result.pagination.page} of {result.pagination.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={!result.pagination.hasNextPage}
                      onClick={() => changePage(result.pagination.page + 1)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}
