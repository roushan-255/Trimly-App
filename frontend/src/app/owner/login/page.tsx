'use client';

import { ArrowRight, Eye, EyeOff, LockKeyhole, Scissors } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AuthApiError, login, storeAuthSession } from '@/lib/auth';

export default function OwnerLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '');

    if (!email.includes('@') || password.length < 8) {
      setError('Enter a valid email and a password of at least 8 characters.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const auth = await login({ email, password, role: 'SHOP_OWNER' });
      storeAuthSession(auth);
      localStorage.removeItem('trimly.mock.customer');
      router.push('/owner/dashboard');
    } catch (caught: unknown) {
      setError(
        caught instanceof AuthApiError
          ? caught.message
          : 'Unable to reach the server. Check that the backend is running.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="brand-panel" aria-label="About Trimly Business">
        <Link className="brand-mark" href="/" aria-label="Trimly home">
          <span className="brand-icon"><Scissors /></span>
          <span>trimly business</span>
        </Link>
        <div className="brand-copy">
          <p className="eyebrow">Owner portal</p>
          <h1>Run your shop<br />with confidence.</h1>
          <p className="brand-description">
            Log in with the same account you use as a customer and open your owner dashboard.
          </p>
        </div>
      </section>

      <section className="form-panel">
        <div className="login-card">
          <div className="welcome-icon"><LockKeyhole /></div>
          <div className="form-heading">
            <p className="eyebrow">Shop owner login</p>
            <h2>Log in to your business</h2>
            <p>Use your owner password. Your customer password can be different.</p>
          </div>

          <form onSubmit={submit} noValidate aria-busy={isSubmitting}>
            <div className="field-group">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
            </div>
            <div className="field-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <Link href="/forgot-password">Forgot password?</Link>
              </div>
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your owner password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in…' : 'Log In as Owner'}
              {!isSubmitting && <ArrowRight />}
            </button>
            {error && <p className="form-status form-status-error" role="alert">{error}</p>}
          </form>

          <p className="signup-copy">Customer access? <Link href="/customer/login">Customer login</Link></p>
          <p className="signup-copy">New shop? <Link href="/owner/register">Register your business</Link></p>
        </div>
      </section>
    </main>
  );
}
