'use client';

import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Plus,
  Scissors,
  ShieldCheck,
  Store,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AuthApiError,
  clearAuthSession,
  readAuthSession,
} from '@/lib/auth';
import {
  OwnerBarber,
  OwnerShop,
  addShopBarber,
  getOwnerShops,
} from '@/lib/owner';

function createTemporaryPassword() {
  const values = crypto.getRandomValues(new Uint32Array(2));
  return `Trimly@${values[0].toString(36)}${values[1].toString(36)}`.slice(0, 18);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [shops, setShops] = useState<OwnerShop[]>([]);
  const [activeShopId, setActiveShopId] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showAddBarber, setShowAddBarber] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const session = readAuthSession();
    if (!session || session.user.role !== 'SHOP_OWNER') {
      clearAuthSession();
      router.replace('/owner/login');
      return;
    }

    setOwnerEmail(session.user.email);
    getOwnerShops()
      .then((ownerShops) => {
        setShops(ownerShops);
        setActiveShopId((current) => current || ownerShops[0]?.id || '');
      })
      .catch((caught: unknown) => {
        if (caught instanceof AuthApiError && caught.status === 401) {
          router.replace('/owner/login');
          return;
        }
        setLoadError(
          caught instanceof AuthApiError
            ? caught.message
            : 'Unable to load your shops.',
        );
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  const activeShop = useMemo(
    () => shops.find((shop) => shop.id === activeShopId) ?? shops[0],
    [activeShopId, shops],
  );
  const barberCount = shops.reduce((total, shop) => total + shop.barbers.length, 0);

  const logout = () => {
    clearAuthSession();
    router.push('/owner/login');
  };

  const addBarberToShop = (barber: OwnerBarber) => {
    setShops((current) =>
      current.map((shop) =>
        shop.id === activeShop?.id
          ? { ...shop, barbers: [...shop.barbers, barber] }
          : shop,
      ),
    );
  };

  return (
    <main className="min-h-screen bg-[#f6f7f4] text-slate-950 lg:grid lg:grid-cols-[270px_1fr]">
      <aside className="hidden min-h-screen border-r border-white/10 bg-[#0d2231] p-6 text-white lg:flex lg:flex-col">
        <Link href="/" className="inline-flex items-center gap-3 text-xl font-extrabold tracking-tight">
          <span className="grid size-10 -rotate-6 place-items-center rounded-xl bg-emerald-200 text-[#0d2231]">
            <Scissors className="size-5" />
          </span>
          trimly business
        </Link>

        <nav className="mt-12 space-y-2" aria-label="Owner dashboard">
          <a href="#overview" className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold">
            <LayoutDashboard className="size-5 text-emerald-200" /> Overview
          </a>
          <a href="#team" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">
            <UsersRound className="size-5" /> Team
          </a>
          <a href="#shop" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">
            <Store className="size-5" /> Shop profile
          </a>
        </nav>

        <div className="mt-auto rounded-2xl border border-emerald-200/15 bg-emerald-200/10 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-emerald-200 font-extrabold text-[#0d2231]">
              {ownerEmail.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">Owner account</p>
              <p className="truncate text-sm text-slate-200">{ownerEmail}</p>
            </div>
          </div>
          <button type="button" onClick={logout} className="mt-4 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white">
            <LogOut className="size-4" /> Log out
          </button>
        </div>
      </aside>

      <section className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="flex h-[76px] items-center justify-between px-5 sm:px-8 lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Owner portal</p>
              <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">Business dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              {activeShop && (
                <label className="relative hidden sm:block">
                  <span className="sr-only">Active shop</span>
                  <select value={activeShop.id} onChange={(event) => setActiveShopId(event.target.value)} className="h-11 appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-bold outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100">
                    {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-4 text-slate-400" />
                </label>
              )}
              <button type="button" onClick={() => setMobileNav((current) => !current)} className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white lg:hidden" aria-label="Toggle owner menu">
                {mobileNav ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
          {mobileNav && (
            <div className="border-t border-slate-100 bg-white px-5 py-4 lg:hidden">
              <p className="truncate text-sm text-slate-500">{ownerEmail}</p>
              <button type="button" onClick={logout} className="mt-3 flex items-center gap-2 text-sm font-bold text-rose-600">
                <LogOut className="size-4" /> Log out
              </button>
            </div>
          )}
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          {isLoading ? (
            <div className="grid min-h-[55vh] place-items-center">
              <div className="text-center">
                <LoaderCircle className="mx-auto size-8 animate-spin text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-500">Loading your business…</p>
              </div>
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
              <h2 className="font-extrabold">We could not load your dashboard</h2>
              <p className="mt-1 text-sm">{loadError}</p>
            </div>
          ) : !activeShop ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Building2 className="mx-auto size-10 text-emerald-600" />
              <h2 className="mt-4 text-2xl font-extrabold">No shop is connected yet</h2>
              <p className="mt-2 text-slate-500">Create a new owner account with a shop to begin.</p>
              <Link href="/owner/register" className="mt-6 inline-flex rounded-xl bg-[#0d2231] px-5 py-3 text-sm font-bold text-white">Register a shop</Link>
            </div>
          ) : (
            <>
              <section id="overview">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-sm font-bold text-emerald-700">Welcome back</p>
                    <h2 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
                      {activeShop.name}
                    </h2>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="size-4 text-emerald-600" />
                      {[activeShop.addressLine1, activeShop.city, activeShop.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <button type="button" onClick={() => setShowAddBarber(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d2231] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-[#173b4c]">
                    <UserPlus className="size-4" /> Add a barber
                  </button>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {[
                    { label: 'Registered shops', value: shops.length, icon: Store, tone: 'bg-blue-50 text-blue-700' },
                    { label: 'Team members', value: barberCount, icon: UsersRound, tone: 'bg-emerald-50 text-emerald-700' },
                    { label: 'Account status', value: 'Active', icon: ShieldCheck, tone: 'bg-amber-50 text-amber-700' },
                  ].map(({ label, value, icon: Icon, tone }) => (
                    <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon className="size-5" /></span>
                        {label === 'Account status' && <CheckCircle2 className="size-5 text-emerald-600" />}
                      </div>
                      <p className="mt-5 text-2xl font-extrabold">{value}</p>
                      <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section id="team" className="mt-10 rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:px-7">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight">Your barber team</h2>
                    <p className="mt-1 text-sm text-slate-500">Every barber added here receives a login account for this shop.</p>
                  </div>
                  <button type="button" onClick={() => setShowAddBarber(true)} className="inline-flex items-center gap-2 self-start rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 sm:self-auto">
                    <Plus className="size-4" /> Add team member
                  </button>
                </div>

                {activeShop.barbers.length === 0 ? (
                  <div className="grid place-items-center px-6 py-16 text-center">
                    <span className="grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <UsersRound className="size-7" />
                    </span>
                    <h3 className="mt-5 text-lg font-extrabold">Build your team</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      Add the barbers who work at {activeShop.name}. They will be linked only to this location.
                    </p>
                    <button type="button" onClick={() => setShowAddBarber(true)} className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700">
                      Add your first barber
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activeShop.barbers.map((barber) => (
                      <article key={barber.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:px-7">
                        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#0d2231] text-sm font-extrabold text-emerald-200">
                          {initials(barber.displayName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-extrabold">{barber.displayName}</h3>
                          <p className="mt-1 flex items-center gap-2 truncate text-sm text-slate-500">
                            <Mail className="size-3.5" /> {barber.user?.email ?? 'No login email'}
                          </p>
                        </div>
                        <p className="max-w-sm text-sm leading-6 text-slate-500">
                          {barber.bio || 'Barber profile created and ready for services.'}
                        </p>
                        <span className="self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 sm:self-auto">Active</span>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section id="shop" className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700">Public information</p>
                      <h2 className="mt-2 text-xl font-extrabold">Shop profile</h2>
                    </div>
                    <Link href={`/shops/${activeShop.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700">
                      View listing <ArrowUpRight className="size-4" />
                    </Link>
                  </div>
                  <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
                    <div><dt className="font-bold text-slate-400">Shop email</dt><dd className="mt-1 font-semibold">{activeShop.email || 'Not provided'}</dd></div>
                    <div><dt className="font-bold text-slate-400">Shop phone</dt><dd className="mt-1 font-semibold">{activeShop.phone || 'Not provided'}</dd></div>
                    <div className="sm:col-span-2"><dt className="font-bold text-slate-400">Full address</dt><dd className="mt-1 font-semibold">{[activeShop.addressLine1, activeShop.addressLine2, activeShop.city, activeShop.state, activeShop.postalCode, activeShop.country].filter(Boolean).join(', ')}</dd></div>
                  </dl>
                </article>
                <article className="rounded-3xl bg-[#0d2231] p-6 text-white shadow-sm sm:p-7">
                  <CircleUserRound className="size-8 text-emerald-200" />
                  <h2 className="mt-5 text-xl font-extrabold">One team, one location</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Barber accounts created here are securely connected to {activeShop.name} and cannot manage another owner&apos;s shop.
                  </p>
                </article>
              </section>
            </>
          )}
        </div>
      </section>

      {showAddBarber && activeShop && (
        <AddBarberPanel
          shop={activeShop}
          onClose={() => setShowAddBarber(false)}
          onAdded={(barber) => {
            addBarberToShop(barber);
            setShowAddBarber(false);
          }}
        />
      )}
    </main>
  );
}

function AddBarberPanel({
  shop,
  onClose,
  onAdded,
}: {
  shop: OwnerShop;
  onClose: () => void;
  onAdded: (barber: OwnerBarber) => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const displayName = String(form.get('displayName') ?? '').trim();
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const phone = String(form.get('phone') ?? '').trim();
    const bio = String(form.get('bio') ?? '').trim();

    if (!displayName || !email.includes('@') || password.length < 8) {
      setError('Enter a name, valid email, and temporary password of at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const barber = await addShopBarber(shop.id, {
        displayName,
        email,
        password,
        ...(phone && { phone }),
        ...(bio && { bio }),
      });
      onAdded(barber);
    } catch (caught: unknown) {
      setError(
        caught instanceof AuthApiError
          ? caught.message
          : 'Unable to add this barber.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 p-0 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-labelledby="add-barber-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close add barber panel" />
      <section className="relative z-10 h-full w-full overflow-y-auto bg-white p-6 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700">{shop.name}</p>
            <h2 id="add-barber-title" className="mt-2 text-3xl font-extrabold tracking-[-0.035em]">Add a barber</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Create a login account and connect this team member to your shop.</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Display name
            <input name="displayName" autoComplete="name" className="h-12 rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" placeholder="Aarav Sharma" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Login email
            <input name="email" type="email" autoComplete="email" className="h-12 rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" placeholder="aarav@example.com" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Phone <span className="font-medium text-slate-400">(optional)</span>
            <input name="phone" type="tel" autoComplete="tel" className="h-12 rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" placeholder="+91 98765 43210" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Temporary password
            <div className="flex gap-2">
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="text" autoComplete="new-password" className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" placeholder="At least 8 characters" />
              <button type="button" onClick={() => setPassword(createTemporaryPassword())} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                <KeyRound className="size-4" /> Generate
              </button>
            </div>
            <span className="font-medium leading-5 text-slate-400">Share this password privately. The barber can use it to log in.</span>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Short bio <span className="font-medium text-slate-400">(optional)</span>
            <textarea name="bio" className="min-h-28 resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" placeholder="Specialises in fades, beard styling, and classic cuts." />
          </label>

          {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}

          <div className="mt-2 flex gap-3 border-t border-slate-100 pt-6">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0d2231] px-4 py-3 text-sm font-bold text-white hover:bg-[#173b4c] disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              {isSubmitting ? 'Adding…' : 'Add barber'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
