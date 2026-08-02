'use client';

import { ArrowRight, Eye, EyeOff, LockKeyhole, Scissors } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { AuthApiError, login, storeAuthSession } from '@/lib/auth';

export default function LoginPage() {
  return <Suspense fallback={<main className="min-h-screen bg-stone-50" />}><LoginContent /></Suspense>;
}
function LoginContent() {
  const router = useRouter(); const searchParams = useSearchParams(); const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '');
    if (!email.includes('@') || password.length < 8) { setError('Enter a valid email and a password of at least 8 characters.'); return; }
    setError(''); setIsSubmitting(true);
    try {
      const auth = await login({ email, password });
      storeAuthSession(auth);
      const returnTo = searchParams.get('returnTo');
      if (auth.user.role === 'SHOP_OWNER') {
        localStorage.removeItem('trimly.mock.customer');
        router.push(returnTo === '/owner/dashboard' ? returnTo : '/owner/dashboard');
        return;
      }
      signIn({ firstName: email.split('@')[0], email: auth.user.email });
      router.push(returnTo === '/checkout' ? '/checkout' : '/');
    } catch (caught: unknown) {
      setError(caught instanceof AuthApiError ? caught.message : 'Unable to reach the server. Check that the backend is running.');
    } finally { setIsSubmitting(false); }
  }
  return <main className="login-shell"><section className="brand-panel" aria-label="About Trimly"><Link className="brand-mark" href="/" aria-label="Trimly home"><span className="brand-icon"><Scissors /></span><span>trimly</span></Link><div className="brand-copy"><p className="eyebrow">Welcome back</p><h1>Pick up where<br />you left off.</h1><p className="brand-description">Log in to manage your bookings or run your shop from the Trimly owner portal.</p></div></section><section className="form-panel"><div className="login-card"><div className="welcome-icon"><LockKeyhole /></div><div className="form-heading"><p className="eyebrow">Secure login</p><h2>Log in to Trimly</h2><p>Customers and shop owners can use their registered email and password.</p></div><form onSubmit={submit} noValidate aria-busy={isSubmitting}><div className="field-group"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" /></div><div className="field-group"><div className="label-row"><label htmlFor="password">Password</label><Link href="/forgot-password">Forgot password?</Link></div><div className="password-field"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff /> : <Eye />}</button></div></div><button className="submit-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in…' : 'Log In'} {!isSubmitting && <ArrowRight />}</button>{error && <p className="form-status form-status-error" role="alert">{error}</p>}</form><p className="signup-copy">New customer? <Link href="/signup">Create an account</Link></p><p className="signup-copy">Own a shop? <Link href="/owner/register">Register your business</Link></p></div></section></main>;
}
