'use client';

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Scissors,
  ShieldCheck,
  Store,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, InputHTMLAttributes, TextareaHTMLAttributes, useState } from 'react';
import {
  AuthApiError,
  login,
  signupShopOwner,
  storeAuthSession,
} from '@/lib/auth';

const steps = [
  { label: 'Your account', icon: ShieldCheck },
  { label: 'Business details', icon: Building2 },
  { label: 'Your first shop', icon: Store },
];

type OwnerForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  businessLegalName: string;
  gstin: string;
  panNumber: string;
  shopName: string;
  shopDescription: string;
  shopPhone: string;
  shopEmail: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const initialForm: OwnerForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  businessLegalName: '',
  gstin: '',
  panNumber: '',
  shopName: '',
  shopDescription: '',
  shopPhone: '',
  shopEmail: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      <span>
        {label}
        {hint && <span className="ml-1 font-medium text-slate-400">{hint}</span>}
      </span>
      <input
        {...props}
        className="h-12 rounded-xl border border-slate-300 bg-white px-4 font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function TextAreaField({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <textarea
        {...props}
        className="min-h-28 resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

export default function OwnerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof OwnerForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validateStep = () => {
    if (
      step === 0 &&
      (!form.firstName.trim() ||
        !form.email.includes('@') ||
        form.password.length < 8 ||
        form.password !== form.confirmPassword)
    ) {
      setError('Enter your name, a valid email, and matching passwords of at least 8 characters.');
      return false;
    }

    if (
      step === 2 &&
      (!form.shopName.trim() ||
        !form.addressLine1.trim() ||
        !form.city.trim() ||
        !form.postalCode.trim() ||
        !form.country.trim())
    ) {
      setError('Complete the required shop and address details.');
      return false;
    }

    setError('');
    return true;
  };

  const next = () => {
    if (validateStep()) setStep((current) => Math.min(current + 1, 2));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 2) {
      next();
      return;
    }
    if (!validateStep()) return;

    const email = form.email.trim().toLowerCase();
    setIsSubmitting(true);
    setError('');

    try {
      await signupShopOwner({
        firstName: form.firstName.trim(),
        ...(form.lastName.trim() && { lastName: form.lastName.trim() }),
        email,
        ...(form.phone.trim() && { phone: form.phone.trim() }),
        password: form.password,
        ...(form.businessLegalName.trim() && {
          businessLegalName: form.businessLegalName.trim(),
        }),
        ...(form.gstin.trim() && { gstin: form.gstin.trim() }),
        ...(form.panNumber.trim() && { panNumber: form.panNumber.trim() }),
        shop: {
          name: form.shopName.trim(),
          ...(form.shopDescription.trim() && {
            description: form.shopDescription.trim(),
          }),
          ...(form.shopPhone.trim() && { phone: form.shopPhone.trim() }),
          ...(form.shopEmail.trim() && {
            email: form.shopEmail.trim().toLowerCase(),
          }),
          addressLine1: form.addressLine1.trim(),
          ...(form.addressLine2.trim() && {
            addressLine2: form.addressLine2.trim(),
          }),
          city: form.city.trim(),
          ...(form.state.trim() && { state: form.state.trim() }),
          postalCode: form.postalCode.trim(),
          country: form.country.trim(),
        },
      });
      const auth = await login({ email, password: form.password });
      storeAuthSession(auth);
      localStorage.removeItem('trimly.mock.customer');
      router.push('/owner/dashboard');
    } catch (caught: unknown) {
      setError(
        caught instanceof AuthApiError
          ? caught.message
          : 'Unable to reach the server. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-slate-950 lg:grid lg:grid-cols-[minmax(320px,0.72fr)_minmax(620px,1.28fr)]">
      <aside className="relative overflow-hidden bg-[#0d2231] px-6 py-8 text-white sm:px-10 lg:flex lg:min-h-screen lg:flex-col lg:px-12 lg:py-10">
        <div className="absolute -right-32 top-28 size-80 rounded-full border border-emerald-200/10 shadow-[0_0_0_55px_rgba(184,231,209,0.035),0_0_0_110px_rgba(184,231,209,0.02)]" />
        <Link href="/" className="relative z-10 inline-flex items-center gap-3 text-2xl font-extrabold tracking-tight">
          <span className="grid size-11 -rotate-6 place-items-center rounded-xl bg-emerald-200 text-[#0d2231]">
            <Scissors className="size-6" />
          </span>
          trimly business
        </Link>

        <div className="relative z-10 mt-14 max-w-md lg:my-auto">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-200">
            Built for shop owners
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-[1.04] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
            Put your shop on the map.
          </h1>
          <p className="mt-6 max-w-sm leading-7 text-slate-300">
            Create your business profile, bring your team together, and start building a
            bookable presence on Trimly.
          </p>

          <div className="mt-10 hidden space-y-5 lg:block">
            {[
              [BadgeCheck, 'A professional page for your shop'],
              [UsersRound, 'Add every barber to the right location'],
              [ShieldCheck, 'Owner-only access to team management'],
            ].map(([Icon, copy]) => {
              const FeatureIcon = Icon as typeof BadgeCheck;
              return (
                <div key={copy as string} className="flex items-center gap-4 text-sm font-semibold text-slate-200">
                  <span className="grid size-10 place-items-center rounded-xl border border-emerald-200/15 bg-emerald-200/10 text-emerald-200">
                    <FeatureIcon className="size-5" />
                  </span>
                  {copy as string}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="px-5 py-8 sm:px-10 lg:grid lg:min-h-screen lg:place-items-center lg:px-14 lg:py-12">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-10 flex items-center justify-between gap-3">
            {steps.map(({ label, icon: Icon }, index) => (
              <div key={label} className="flex flex-1 items-center gap-3">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-extrabold ${
                    index < step
                      ? 'bg-emerald-600 text-white'
                      : index === step
                        ? 'bg-[#0d2231] text-white'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {index < step ? <Check className="size-4" /> : <Icon className="size-4" />}
                </span>
                <span className={`hidden text-sm font-bold sm:block ${index === step ? 'text-slate-950' : 'text-slate-400'}`}>
                  {label}
                </span>
                {index < steps.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-9">
            {step === 0 && (
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">Step 1 of 3</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.035em]">Create your owner account</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">These details will be used to secure your business dashboard.</p>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <Field label="First name" required autoComplete="given-name" value={form.firstName} onChange={(event) => update('firstName', event.target.value)} />
                  <Field label="Last name" hint="(optional)" autoComplete="family-name" value={form.lastName} onChange={(event) => update('lastName', event.target.value)} />
                  <Field label="Work email" type="email" required autoComplete="email" placeholder="owner@yourshop.com" value={form.email} onChange={(event) => update('email', event.target.value)} />
                  <Field label="Phone" hint="(optional)" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={form.phone} onChange={(event) => update('phone', event.target.value)} />
                  <Field label="Password" type="password" required autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={(event) => update('password', event.target.value)} />
                  <Field label="Confirm password" type="password" required autoComplete="new-password" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">Step 2 of 3</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.035em]">Tell us about the business</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Legal details are optional for now and can support verification later.</p>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Registered business name" hint="(optional)" placeholder="Trimly Grooming Private Limited" value={form.businessLegalName} onChange={(event) => update('businessLegalName', event.target.value)} />
                  </div>
                  <Field label="GSTIN" hint="(optional)" placeholder="22AAAAA0000A1Z5" value={form.gstin} onChange={(event) => update('gstin', event.target.value.toUpperCase())} />
                  <Field label="PAN" hint="(optional)" placeholder="AAAAA0000A" value={form.panNumber} onChange={(event) => update('panNumber', event.target.value.toUpperCase())} />
                </div>
                <div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                  You can create your shop without submitting tax details. Your verification status will begin as <strong>Not submitted</strong>.
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">Step 3 of 3</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.035em]">Register your first shop</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Customers will use this information to discover and contact your location.</p>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Shop name" required placeholder="The Gentleman's Chair" value={form.shopName} onChange={(event) => update('shopName', event.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <TextAreaField label="Shop description" placeholder="Tell customers what makes your shop special…" value={form.shopDescription} onChange={(event) => update('shopDescription', event.target.value)} />
                  </div>
                  <Field label="Shop phone" hint="(optional)" type="tel" placeholder="+91 98765 43210" value={form.shopPhone} onChange={(event) => update('shopPhone', event.target.value)} />
                  <Field label="Shop email" hint="(optional)" type="email" placeholder="hello@yourshop.com" value={form.shopEmail} onChange={(event) => update('shopEmail', event.target.value)} />
                  <div className="sm:col-span-2">
                    <Field label="Address line 1" required autoComplete="address-line1" placeholder="12, Market Road" value={form.addressLine1} onChange={(event) => update('addressLine1', event.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Address line 2" hint="(optional)" autoComplete="address-line2" placeholder="Near City Mall" value={form.addressLine2} onChange={(event) => update('addressLine2', event.target.value)} />
                  </div>
                  <Field label="City" required autoComplete="address-level2" value={form.city} onChange={(event) => update('city', event.target.value)} />
                  <Field label="State" hint="(optional)" autoComplete="address-level1" value={form.state} onChange={(event) => update('state', event.target.value)} />
                  <Field label="Postal code" required autoComplete="postal-code" value={form.postalCode} onChange={(event) => update('postalCode', event.target.value)} />
                  <Field label="Country" required autoComplete="country-name" value={form.country} onChange={(event) => update('country', event.target.value)} />
                </div>
              </div>
            )}

            {error && <p role="alert" className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-100 pt-6">
              {step > 0 ? (
                <button type="button" onClick={() => { setError(''); setStep((current) => current - 1); }} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100">
                  <ArrowLeft className="size-4" /> Back
                </button>
              ) : (
                <p className="text-sm text-slate-500">
                  Already registered? <Link href="/login?returnTo=/owner/dashboard" className="font-bold text-emerald-700">Log in</Link>
                </p>
              )}
              <button type="submit" disabled={isSubmitting} className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-[#0d2231] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-[#173b4c] disabled:cursor-wait disabled:opacity-60">
                {isSubmitting ? 'Creating shop…' : step === 2 ? 'Create business' : 'Continue'}
                {!isSubmitting && <ArrowRight className="size-4" />}
              </button>
            </div>
          </form>
          <p className="mt-5 text-center text-xs leading-5 text-slate-400">
            By registering, you confirm that you are authorised to manage this business on Trimly.
          </p>
        </div>
      </section>
    </main>
  );
}
