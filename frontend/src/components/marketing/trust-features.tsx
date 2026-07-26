import { BadgeCheck, CalendarCheck2, Clock3, Trophy } from 'lucide-react';

const features = [
  { icon: Trophy, title: 'Top Rated Shops', description: 'Compare the best-rated shops nearby' },
  { icon: BadgeCheck, title: 'Verified Professionals', description: 'View trusted barber profiles inside each shop' },
  { icon: CalendarCheck2, title: 'Live Availability', description: 'Check remaining appointment slots' },
  { icon: Clock3, title: 'No More Waiting', description: 'Reserve a slot and skip long queues' },
];

export function TrustFeatures() {
  return <section id="how-it-works" className="scroll-mt-24 bg-stone-50 py-28 sm:py-32">
    <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {features.map(({ icon: Icon, title, description }) => <article key={title} className="flex items-start gap-4 lg:flex-col lg:items-center lg:text-center">
          <span className="grid size-14 shrink-0 place-items-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700"><Icon className="size-6" strokeWidth={1.8} /></span>
          <div><h2 className="text-base font-extrabold tracking-tight text-slate-900">{title}</h2><p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p></div>
        </article>)}
      </div>
    </div>
  </section>;
}
