'use client';

import {
  ArrowUpRight,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Plus,
  Pencil,
  Scissors,
  ShieldCheck,
  Store,
  UserPlus,
  UsersRound,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ShopImageField } from '@/components/owner/shop-image-field';
import {
  AuthApiError,
  clearAuthSession,
  readAuthSession,
} from '@/lib/auth';
import {
  OwnerBarber,
  OwnerService,
  OwnerShop,
  OwnerVisit,
  addShopService,
  addShopBarber,
  deactivateShopService,
  getOwnerShops,
  getOwnerVisits,
  removeShopBarber,
  updateOwnerShop,
  updateShopBarber,
  updateShopService,
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
  const [editingBarber, setEditingBarber] = useState<OwnerBarber | null>(null);
  const [removingBarber, setRemovingBarber] = useState<OwnerBarber | null>(null);
  const [isRemovingBarber, setIsRemovingBarber] = useState(false);
  const [barberActionError, setBarberActionError] = useState('');
  const [showEditShop, setShowEditShop] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<OwnerService | null>(null);
  const [serviceActionId, setServiceActionId] = useState('');
  const [serviceActionError, setServiceActionError] = useState('');
  const [visits, setVisits] = useState<OwnerVisit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [visitsError, setVisitsError] = useState('');
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
  const activeServiceCount = activeShop?.services.filter((service) => service.isActive).length ?? 0;

  useEffect(() => {
    if (!activeShop?.id) return;
    let active = true;
    setVisitsLoading(true);
    setVisitsError('');
    getOwnerVisits(activeShop.id)
      .then((items) => active && setVisits(items))
      .catch((caught: unknown) => {
        if (!active) return;
        setVisitsError(
          caught instanceof AuthApiError
            ? caught.message
            : 'Unable to load visit notices.',
        );
      })
      .finally(() => active && setVisitsLoading(false));
    return () => {
      active = false;
    };
  }, [activeShop?.id]);

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

  const replaceBarber = (barber: OwnerBarber) => {
    setShops((current) =>
      current.map((shop) =>
        shop.id === activeShop?.id
          ? {
              ...shop,
              barbers: shop.barbers.map((currentBarber) =>
                currentBarber.id === barber.id ? barber : currentBarber,
              ),
            }
          : shop,
      ),
    );
  };

  const replaceShop = (updatedShop: OwnerShop) => {
    setShops((current) =>
      current.map((shop) => (shop.id === updatedShop.id ? updatedShop : shop)),
    );
  };

  const addServiceToShop = (service: OwnerService) => {
    setShops((current) =>
      current.map((shop) =>
        shop.id === activeShop?.id
          ? { ...shop, services: [...shop.services, service] }
          : shop,
      ),
    );
  };

  const replaceService = (service: OwnerService) => {
    setShops((current) =>
      current.map((shop) =>
        shop.id === activeShop?.id
          ? {
              ...shop,
              services: shop.services.map((currentService) =>
                currentService.id === service.id ? service : currentService,
              ),
            }
          : shop,
      ),
    );
  };

  const toggleService = async (service: OwnerService) => {
    if (!activeShop) return;
    setServiceActionId(service.id);
    setServiceActionError('');
    try {
      const updated = service.isActive
        ? await deactivateShopService(activeShop.id, service.id)
        : await updateShopService(activeShop.id, service.id, {
            name: service.name,
            description: service.description,
            price: Number(service.price),
            isActive: true,
          });
      replaceService(updated);
    } catch (caught: unknown) {
      setServiceActionError(
        caught instanceof AuthApiError
          ? caught.message
          : 'Unable to update this service.',
      );
    } finally {
      setServiceActionId('');
    }
  };

  const confirmRemoveBarber = async () => {
    if (!activeShop || !removingBarber) return;
    setIsRemovingBarber(true);
    setBarberActionError('');
    try {
      await removeShopBarber(activeShop.id, removingBarber.id);
      setShops((current) =>
        current.map((shop) =>
          shop.id === activeShop.id
            ? {
                ...shop,
                barbers: shop.barbers.filter(
                  (barber) => barber.id !== removingBarber.id,
                ),
              }
            : shop,
        ),
      );
      setRemovingBarber(null);
    } catch (caught: unknown) {
      setBarberActionError(
        caught instanceof AuthApiError
          ? caught.message
          : 'Unable to remove this barber.',
      );
    } finally {
      setIsRemovingBarber(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7f4] text-slate-950 lg:grid lg:grid-cols-[270px_1fr]">
      <aside className="hidden min-h-screen border-r border-white/10 bg-[#0d2231] p-6 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:self-start lg:flex-col lg:overflow-hidden">
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
          <a href="#services" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">
            <ClipboardList className="size-5" /> Services
          </a>
          <a href="#visits" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">
            <CalendarCheck2 className="size-5" /> Visit notices
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

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Registered shops', value: shops.length, icon: Store, tone: 'bg-blue-50 text-blue-700' },
                    { label: 'Team members', value: barberCount, icon: UsersRound, tone: 'bg-emerald-50 text-emerald-700' },
                    { label: 'Published services', value: activeServiceCount, icon: ClipboardList, tone: 'bg-violet-50 text-violet-700' },
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
                    {barberActionError && <p role="alert" className="m-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 sm:mx-7">{barberActionError}</p>}
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
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Active</span>
                          <button type="button" onClick={() => setEditingBarber(barber)} className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700" aria-label={`Edit ${barber.displayName}`}><Pencil className="size-4" /></button>
                          <button type="button" onClick={() => { setBarberActionError(''); setRemovingBarber(barber); }} className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${barber.displayName}`}><Trash2 className="size-4" /></button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section id="services" className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:px-7">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight">Shop services</h2>
                    <p className="mt-1 text-sm text-slate-500">Set what customers can book and how much each service costs.</p>
                  </div>
                  <button type="button" onClick={() => setShowAddService(true)} className="inline-flex items-center gap-2 self-start rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 sm:self-auto">
                    <Plus className="size-4" /> Add service
                  </button>
                </div>

                {serviceActionError && <p role="alert" className="m-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 sm:mx-7">{serviceActionError}</p>}
                {activeShop.services.length === 0 ? (
                  <div className="grid place-items-center px-6 py-14 text-center">
                    <span className="grid size-14 place-items-center rounded-2xl bg-violet-50 text-violet-700"><ClipboardList className="size-7" /></span>
                    <h3 className="mt-5 text-lg font-extrabold">Publish your first service</h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Services appear on your public shop page and become available during booking.</p>
                    <button type="button" onClick={() => setShowAddService(true)} className="mt-5 rounded-xl bg-[#0d2231] px-5 py-3 text-sm font-bold text-white">Add a service</button>
                  </div>
                ) : (
                  <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
                    {activeShop.services.map((service) => (
                      <article key={service.id} className={`rounded-2xl border p-5 ${service.isActive ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-75'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div><h3 className="font-extrabold">{service.name}</h3><p className="mt-1 text-xs font-bold text-slate-400">{service.durationMin} min booking unit</p></div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${service.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{service.isActive ? 'Published' : 'Hidden'}</span>
                        </div>
                        <p className="mt-4 min-h-10 text-sm leading-5 text-slate-500">{service.description || 'No description added.'}</p>
                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                          <strong className="text-lg text-emerald-700">₹{service.price}</strong>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setEditingService(service)} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"><Pencil className="mr-1 inline size-3.5" /> Edit</button>
                            <button type="button" disabled={serviceActionId === service.id} onClick={() => void toggleService(service)} className={`rounded-lg px-3 py-2 text-xs font-bold ${service.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-700 hover:bg-emerald-50'}`}>{serviceActionId === service.id ? 'Saving…' : service.isActive ? 'Hide' : 'Publish'}</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section id="visits" className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6 sm:px-7">
                  <h2 className="text-xl font-extrabold tracking-tight">Upcoming visit notices</h2>
                  <p className="mt-1 text-sm text-slate-500">Customers who have let your shop and barber know they are coming.</p>
                </div>
                {visitsLoading ? (
                  <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm font-semibold text-slate-500"><LoaderCircle className="size-5 animate-spin text-emerald-600" /> Loading visit notices…</div>
                ) : visitsError ? (
                  <p role="alert" className="m-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{visitsError}</p>
                ) : visits.length === 0 ? (
                  <div className="grid place-items-center px-6 py-12 text-center"><CalendarCheck2 className="size-8 text-emerald-600" /><h3 className="mt-3 font-extrabold">No upcoming visit notices</h3><p className="mt-1 text-sm text-slate-500">New date-only bookings will appear here.</p></div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {visits.map((visit) => (
                      <article key={visit.id} className="grid gap-4 p-5 sm:grid-cols-[150px_1fr_auto] sm:items-center sm:px-7">
                        <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Visit date</p><p className="mt-1 font-extrabold text-emerald-800">{new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${visit.visitDate}T00:00:00.000Z`))}</p><p className="mt-1 text-xs font-semibold text-slate-400">Flexible arrival</p></div>
                        <div><h3 className="font-extrabold">{visit.customerName}</h3><p className="mt-1 text-sm text-slate-500">With {visit.barber.displayName} · {visit.services.map((service) => service.name).join(', ')}</p></div>
                        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Notified</span>
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
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setShowEditShop(true)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"><Pencil className="size-4" /> Edit</button>
                      <Link href={`/shops/${activeShop.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700">View listing <ArrowUpRight className="size-4" /></Link>
                    </div>
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
      {editingBarber && activeShop && (
        <EditBarberPanel
          shop={activeShop}
          barber={editingBarber}
          onClose={() => setEditingBarber(null)}
          onUpdated={(barber) => {
            replaceBarber(barber);
            setEditingBarber(null);
          }}
        />
      )}
      {showEditShop && activeShop && (
        <EditShopPanel
          shop={activeShop}
          onClose={() => setShowEditShop(false)}
          onUpdated={(shop) => {
            replaceShop(shop);
            setShowEditShop(false);
          }}
        />
      )}
      {showAddService && activeShop && (
        <ServicePanel
          shop={activeShop}
          onClose={() => setShowAddService(false)}
          onSaved={(service) => {
            addServiceToShop(service);
            setShowAddService(false);
          }}
        />
      )}
      {editingService && activeShop && (
        <ServicePanel
          shop={activeShop}
          service={editingService}
          onClose={() => setEditingService(null)}
          onSaved={(service) => {
            replaceService(service);
            setEditingService(null);
          }}
        />
      )}
      {removingBarber && activeShop && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="remove-barber-title">
          <button type="button" className="absolute inset-0 cursor-default" onClick={() => !isRemovingBarber && setRemovingBarber(null)} aria-label="Close remove barber confirmation" />
          <section className="relative z-10 w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <span className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600"><Trash2 className="size-5" /></span>
            <h2 id="remove-barber-title" className="mt-5 text-2xl font-extrabold">Remove {removingBarber.displayName}?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">They will be removed from {activeShop.name}. Their account, past appointments, and reviews will be preserved.</p>
            {barberActionError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{barberActionError}</p>}
            <div className="mt-7 flex gap-3">
              <button type="button" disabled={isRemovingBarber} onClick={() => setRemovingBarber(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Keep barber</button>
              <button type="button" disabled={isRemovingBarber} onClick={() => void confirmRemoveBarber()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60">{isRemovingBarber && <LoaderCircle className="size-4 animate-spin" />}{isRemovingBarber ? 'Removing…' : 'Remove'}</button>
            </div>
          </section>
        </div>
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

function EditBarberPanel({
  shop,
  barber,
  onClose,
  onUpdated,
}: {
  shop: OwnerShop;
  barber: OwnerBarber;
  onClose: () => void;
  onUpdated: (barber: OwnerBarber) => void;
}) {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const displayName = String(form.get('displayName') ?? '').trim();
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const phone = String(form.get('phone') ?? '').trim();
    const bio = String(form.get('bio') ?? '').trim();

    if (!displayName || (barber.user && !email.includes('@'))) {
      setError('Enter a name and a valid login email.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const updated = await updateShopBarber(shop.id, barber.id, {
        displayName,
        ...(barber.user ? { email, phone: phone || null } : {}),
        bio: bio || null,
      });
      onUpdated(updated);
    } catch (caught: unknown) {
      setError(
        caught instanceof AuthApiError
          ? caught.message
          : 'Unable to update this barber.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardPanel title="Edit barber" eyebrow={shop.name} description="Update this team member’s public profile and login contact details." onClose={onClose}>
      <form onSubmit={submit} className="mt-8 grid gap-5">
        <DashboardField label="Display name" name="displayName" defaultValue={barber.displayName} autoComplete="name" />
        {barber.user ? (
          <>
            <DashboardField label="Login email" name="email" type="email" defaultValue={barber.user.email} autoComplete="email" />
            <DashboardField label="Phone" hint="(optional)" name="phone" type="tel" defaultValue={barber.user.phone ?? ''} autoComplete="tel" />
          </>
        ) : (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">This is a shop-managed profile without a login account. You can still update its name and bio.</p>
        )}
        <label className="grid gap-2 text-sm font-bold text-slate-700">Short bio <span className="font-medium text-slate-400">(optional)</span><textarea name="bio" defaultValue={barber.bio ?? ''} className="min-h-28 resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" /></label>
        <PanelActions error={error} submitting={isSubmitting} onClose={onClose} submitLabel="Save barber" submittingLabel="Saving…" />
      </form>
    </DashboardPanel>
  );
}

function EditShopPanel({
  shop,
  onClose,
  onUpdated,
}: {
  shop: OwnerShop;
  onClose: () => void;
  onUpdated: (shop: OwnerShop) => void;
}) {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState(
    shop.imageUrls.length ? shop.imageUrls : shop.imageUrl ? [shop.imageUrl] : [],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? '').trim();
    const name = value('name');
    const addressLine1 = value('addressLine1');
    const city = value('city');
    const postalCode = value('postalCode');
    const country = value('country');
    if (!name || !addressLine1 || !city || !postalCode || !country) {
      setError('Complete the required shop and address fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const updated = await updateOwnerShop(shop.id, {
        name,
        description: value('description'),
        imageUrl: imageUrls[0] ?? '',
        imageUrls,
        phone: value('phone'),
        email: value('email').toLowerCase(),
        addressLine1,
        addressLine2: value('addressLine2'),
        locality: value('locality'),
        city,
        state: value('state'),
        postalCode,
        country,
      });
      onUpdated(updated);
    } catch (caught: unknown) {
      setError(
        caught instanceof AuthApiError
          ? caught.message
          : 'Unable to update this shop.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardPanel title="Edit shop profile" eyebrow="Public information" description="Keep the details customers see on your Trimly listing up to date." onClose={onClose}>
      <form onSubmit={submit} className="mt-8 grid gap-5">
        <DashboardField label="Shop name" name="name" defaultValue={shop.name} />
        <label className="grid gap-2 text-sm font-bold text-slate-700">Description <span className="font-medium text-slate-400">(optional)</span><textarea name="description" defaultValue={shop.description ?? ''} className="min-h-28 resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" /></label>
        <ShopImageField value={imageUrls} onChange={setImageUrls} />
        <div className="grid gap-5 sm:grid-cols-2">
          <DashboardField label="Shop email" hint="(optional)" name="email" type="email" defaultValue={shop.email ?? ''} />
          <DashboardField label="Shop phone" hint="(optional)" name="phone" type="tel" defaultValue={shop.phone ?? ''} />
        </div>
        <DashboardField label="Address line 1" name="addressLine1" defaultValue={shop.addressLine1} />
        <DashboardField label="Address line 2" hint="(optional)" name="addressLine2" defaultValue={shop.addressLine2 ?? ''} />
        <div className="grid gap-5 sm:grid-cols-2">
          <DashboardField label="Locality" hint="(optional)" name="locality" defaultValue={shop.locality ?? ''} />
          <DashboardField label="City" name="city" defaultValue={shop.city} />
          <DashboardField label="State" hint="(optional)" name="state" defaultValue={shop.state ?? ''} />
          <DashboardField label="Postal code" name="postalCode" defaultValue={shop.postalCode} />
        </div>
        <DashboardField label="Country" name="country" defaultValue={shop.country} />
        <PanelActions error={error} submitting={isSubmitting} onClose={onClose} submitLabel="Save shop" submittingLabel="Saving…" />
      </form>
    </DashboardPanel>
  );
}

function ServicePanel({
  shop,
  service,
  onClose,
  onSaved,
}: {
  shop: OwnerShop;
  service?: OwnerService;
  onClose: () => void;
  onSaved: (service: OwnerService) => void;
}) {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const description = String(form.get('description') ?? '').trim();
    const price = Number(form.get('price'));
    const isActive = service
      ? form.get('isActive') === 'on'
      : true;

    if (name.length < 2 || !Number.isFinite(price) || price < 0) {
      setError('Enter a service name and a valid non-negative price.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const saved = service
        ? await updateShopService(shop.id, service.id, {
            name,
            description: description || null,
            price,
            isActive,
          })
        : await addShopService(shop.id, {
            name,
            ...(description && { description }),
            price,
          });
      onSaved(saved);
    } catch (caught: unknown) {
      setError(
        caught instanceof AuthApiError
          ? caught.message
          : 'Unable to save this service.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardPanel
      title={service ? 'Edit service' : 'Add a service'}
      eyebrow={shop.name}
      description="Each service is currently booked in a 10-minute unit. Set the public name, price, and description here."
      onClose={onClose}
    >
      <form onSubmit={submit} className="mt-8 grid gap-5">
        <DashboardField label="Service name" name="name" defaultValue={service?.name ?? ''} placeholder="Classic haircut" />
        <DashboardField label="Price (₹)" name="price" type="number" min="0" step="0.01" defaultValue={service?.price ?? ''} placeholder="349" />
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          <span>Description <span className="font-medium text-slate-400">(optional)</span></span>
          <textarea name="description" defaultValue={service?.description ?? ''} className="min-h-28 resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" placeholder="What is included in this service?" />
        </label>
        {service && (
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm">
            <input name="isActive" type="checkbox" defaultChecked={service.isActive} className="mt-0.5 size-4 accent-emerald-600" />
            <span><strong className="block text-slate-800">Published</strong><span className="mt-1 block leading-5 text-slate-500">Customers can see and book this service. Turn this off to preserve it without showing it publicly.</span></span>
          </label>
        )}
        <PanelActions error={error} submitting={isSubmitting} onClose={onClose} submitLabel={service ? 'Save service' : 'Add service'} submittingLabel="Saving…" />
      </form>
    </DashboardPanel>
  );
}

function DashboardPanel({
  title,
  eyebrow,
  description,
  onClose,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 p-0 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label={`Close ${title}`} />
      <section className="relative z-10 h-full w-full overflow-y-auto bg-white p-6 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700">{eyebrow}</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-0.035em]">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label="Close"><X className="size-5" /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function DashboardField({ label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return <label className="grid gap-2 text-sm font-bold text-slate-700"><span>{label} {hint && <span className="font-medium text-slate-400">{hint}</span>}</span><input {...props} className="h-12 rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" /></label>;
}

function PanelActions({ error, submitting, onClose, submitLabel, submittingLabel }: { error: string; submitting: boolean; onClose: () => void; submitLabel: string; submittingLabel: string }) {
  return <>{error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}<div className="mt-2 flex gap-3 border-t border-slate-100 pt-6"><button type="button" onClick={onClose} disabled={submitting} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" disabled={submitting} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0d2231] px-4 py-3 text-sm font-bold text-white hover:bg-[#173b4c] disabled:opacity-60">{submitting && <LoaderCircle className="size-4 animate-spin" />}{submitting ? submittingLabel : submitLabel}</button></div></>;
}
