import { ShopDirectory } from '@/components/marketing/shop-directory';
import { Navbar } from '@/components/marketing/navbar';
import { Suspense } from 'react';

export default function ShopsPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <Navbar />
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-5 py-16 text-sm font-semibold text-slate-500 sm:px-8 lg:px-10">
            Preparing shop search…
          </div>
        }
      >
        <ShopDirectory />
      </Suspense>
    </main>
  );
}
