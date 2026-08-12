'use client';

import { Clock3, Search, Scissors, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PublicService } from '@/lib/shops';

export function ShopServicesDrawer({
  open,
  shopName,
  services,
  onClose,
}: {
  open: boolean;
  shopName: string;
  services: PublicService[];
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return services;

    return services.filter((service) =>
      [
        service.name,
        service.description ?? '',
        `${service.durationMin}`,
        `${service.durationMin} min`,
        `${service.durationMin} minutes`,
        `${service.price}`,
        `₹${service.price}`,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, services]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setQuery('');
    window.setTimeout(() => searchInputRef.current?.focus(), 100);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="services-drawer-title"
    >
      <button
        type="button"
        aria-label="Close services"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
      />
      <section className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-stone-50 shadow-2xl">
        <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">
                Service menu
              </p>
              <h2
                id="services-drawer-title"
                className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950"
              >
                {shopName}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {services.length} {services.length === 1 ? 'service' : 'services'} available
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close services"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <X className="size-5" />
            </button>
          </div>
          <label className="relative mt-5 block">
            <span className="sr-only">Search services</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, details, duration or price"
              className="h-12 w-full rounded-xl border border-slate-200 bg-stone-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </label>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {filteredServices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Search className="mx-auto size-8 text-slate-300" />
              <h3 className="mt-3 font-extrabold text-slate-900">
                No matching services
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try a service name, duration, description, or price.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredServices.map((service) => (
                <article
                  key={service.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-950">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <strong className="shrink-0 text-lg text-emerald-700">
                      ₹{service.price}
                    </strong>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Clock3 className="size-3.5" /> {service.durationMin} min
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        <footer className="border-t border-slate-200 bg-white px-6 py-4 text-xs leading-5 text-slate-500 sm:px-8">
          <span className="inline-flex items-center gap-2 font-semibold">
            <Scissors className="size-4 text-emerald-600" />
            Choose a team member to select services and plan your visit.
          </span>
        </footer>
      </section>
    </div>
  );
}
