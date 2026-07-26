import { Scissors } from 'lucide-react';
import Link from 'next/link';

export function Brand() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-4" aria-label="Trimly home">
      <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm transition-transform group-hover:-rotate-6">
        <Scissors className="size-5" strokeWidth={2.4} aria-hidden="true" />
      </span>
      <span className="text-2xl font-extrabold tracking-[-0.06em] text-slate-950">trimly</span>
    </Link>
  );
}
