'use client';

import { LoaderCircle, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AuthApiError } from '@/lib/auth';
import { PublicShop, getPublicShops } from '@/lib/shops';
import { ShopCard } from './shop-card';

export function ShopGrid({
  limit,
  search,
}: {
  limit: number;
  search?: string;
}) {
  const [shops, setShops] = useState<PublicShop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError('');
    getPublicShops({ limit, search })
      .then(setShops)
      .catch((caught: unknown) =>
        setError(
          caught instanceof AuthApiError
            ? caught.message
            : 'Unable to load shops right now.',
        ),
      )
      .finally(() => setIsLoading(false));
  }, [limit, search]);

  if (isLoading) {
    return (
      <div className="grid min-h-52 place-items-center rounded-2xl border border-slate-200 bg-stone-50">
        <div className="text-center text-sm font-semibold text-slate-500">
          <LoaderCircle className="mx-auto mb-3 size-6 animate-spin text-emerald-600" />
          Loading registered shops…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
        {error}
      </p>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-slate-300 bg-stone-50 p-8 text-center">
        <div>
          <Store className="mx-auto size-8 text-emerald-600" />
          <h3 className="mt-3 font-extrabold text-slate-900">No matching shops yet</h3>
          <p className="mt-1 text-sm text-slate-500">Try another city, service, or shop name.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {shops.map((shop) => <ShopCard key={shop.id} shop={shop} />)}
    </div>
  );
}

