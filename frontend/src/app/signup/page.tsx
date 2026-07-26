'use client';

import { ArrowRight, LockKeyhole, Scissors } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { AuthApiError, login, signupCustomer, storeAuthSession } from '@/lib/auth';

export default function SignupPage() {
  return <Suspense fallback={<main className="min-h-screen bg-stone-50" />}><SignupContent /></Suspense>;
}
function SignupContent() {
  const router = useRouter(); const params = useSearchParams(); const { signIn } = useAuth(); const [error, setError] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const firstName = String(data.get('firstName') ?? '').trim();
    const lastName = String(data.get('lastName') ?? '').trim();
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    const phone = String(data.get('phone') ?? '').trim();
    const password = String(data.get('password') ?? '');
    if (!firstName || !email.includes('@') || password.length < 8 || password !== data.get('confirmPassword')) { setError('Please complete every required field and make sure your passwords match.'); return; }

    setError('');
    setIsSubmitting(true);
    try {
      await signupCustomer({ firstName, ...(lastName && { lastName }), email, ...(phone && { phone }), password });
      const auth = await login({ email, password });
      storeAuthSession(auth);
      signIn({ firstName, email });
      router.push(params.get('returnTo') === '/checkout' ? '/checkout' : '/');
    } catch (caught: unknown) {
      setError(caught instanceof AuthApiError ? caught.message : 'Unable to reach the server. Check that the backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  }
  return <main className="login-shell"><section className="brand-panel" aria-label="About Trimly"><Link className="brand-mark" href="/" aria-label="Trimly home"><span className="brand-icon"><Scissors /></span><span>trimly</span></Link><div className="brand-copy"><p className="eyebrow">Join Trimly</p><h1>Your next great<br />cut starts here.</h1><p className="brand-description">Create an account to save favourites, leave reviews, and keep every booking in one place.</p></div></section><section className="form-panel"><div className="login-card"><div className="welcome-icon"><LockKeyhole /></div><div className="form-heading"><p className="eyebrow">Customer account</p><h2>Create your account</h2><p>It only takes a minute. You can still browse without signing up.</p></div><form onSubmit={submit} noValidate aria-busy={isSubmitting}><div className="grid grid-cols-2 gap-3"><div className="field-group"><label htmlFor="firstName">First name</label><input id="firstName" name="firstName" autoComplete="given-name" /></div><div className="field-group"><label htmlFor="lastName">Last name</label><input id="lastName" name="lastName" autoComplete="family-name" /></div></div><div className="field-group"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" /></div><div className="field-group"><label htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" /></div><div className="field-group"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" /></div><div className="field-group"><label htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" /></div><button className="submit-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create Account'} {!isSubmitting && <ArrowRight />}</button>{error && <p className="form-status form-status-error" role="alert">{error}</p>}</form><p className="signup-copy">Already have an account? <Link href="/login">Log In</Link></p></div></section></main>;
}
