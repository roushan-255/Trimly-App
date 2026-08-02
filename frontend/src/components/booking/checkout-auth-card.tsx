'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { AuthApiError, login, signupCustomer, storeAuthSession } from '@/lib/auth';

export function CheckoutAuthCard({ onAuthenticated }: { onAuthenticated: () => void }) {
  const { signIn } = useAuth(); const [mode, setMode] = useState<'login' | 'signup'>('login'); const [error, setError] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    const password = String(data.get('password') ?? '');
    const firstName = String(data.get('firstName') ?? '').trim();
    if (!email.includes('@') || password.length < 8 || (mode === 'signup' && !firstName)) { setError('Please enter valid account details to continue.'); return; }
    setError(''); setIsSubmitting(true);
    try {
      if (mode === 'signup') await signupCustomer({ firstName, email, password });
      const auth = await login({ email, password, role: 'CUSTOMER' });
      storeAuthSession(auth);
      signIn({ firstName: firstName || email.split('@')[0], email: auth.user.email });
      onAuthenticated();
    } catch (caught: unknown) {
      setError(caught instanceof AuthApiError ? caught.message : 'Unable to reach the server. Check that the backend is running.');
    } finally { setIsSubmitting(false); }
  }
  return <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-xl shadow-slate-900/5"><div className="bg-emerald-50 p-6 sm:p-8"><CheckCircle2 className="size-8 text-emerald-700" /><h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950">Almost there</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">Your selected appointment is saved. Log in or create an account to complete your booking.</p></div><div className="p-6 sm:p-8"><div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => { setMode('login'); setError(''); }} className={`rounded-lg py-2 text-sm font-bold ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Log In</button><button type="button" onClick={() => { setMode('signup'); setError(''); }} className={`rounded-lg py-2 text-sm font-bold ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Create Account</button></div><form onSubmit={submit} className="space-y-4" noValidate aria-busy={isSubmitting}>{mode === 'signup' && <label className="block text-sm font-bold text-slate-700">First name<input name="firstName" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>}<label className="block text-sm font-bold text-slate-700">Email<input name="email" type="email" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><label className="block text-sm font-bold text-slate-700">{mode === 'signup' ? 'New customer password' : 'Password'}<input name="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Please wait…' : mode === 'login' ? 'Log In & Continue' : 'Create Account & Continue'} {!isSubmitting && <ArrowRight className="size-4" />}</button>{error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}</form><p className="mt-5 text-center text-xs text-slate-500">Prefer the full account page? <Link href={mode === 'login' ? '/customer/login?returnTo=/checkout' : '/signup?returnTo=/checkout'} className="font-bold text-emerald-700">Open {mode === 'login' ? 'Log In' : 'Sign Up'}</Link></p></div></section>;
}
