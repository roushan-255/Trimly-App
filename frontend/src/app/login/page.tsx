'use client';

import {
  ArrowRight,
  CalendarCheck2,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Scissors,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { AuthApiError, login, LoginResponse } from '@/lib/auth';

type FormStatus = {
  kind: 'idle' | 'error' | 'success';
  message: string;
};

const ACCESS_TOKEN_KEY = 'trimly.accessToken';
const USER_KEY = 'trimly.user';

function storeSession(auth: LoginResponse, remember: boolean) {
  const selectedStorage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;

  otherStorage.removeItem(ACCESS_TOKEN_KEY);
  otherStorage.removeItem(USER_KEY);
  selectedStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
  selectedStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ kind: 'idle', message: '' });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '');
    const remember = form.get('remember') === 'on';

    setIsSubmitting(true);
    setStatus({ kind: 'idle', message: '' });

    try {
      const auth = await login({ email, password });
      storeSession(auth, remember);
      const role = auth.user.role.toLowerCase().replace('_', ' ');

      setStatus({
        kind: 'success',
        message: `Signed in successfully as ${role}.`,
      });
    } catch (error: unknown) {
      const message =
        error instanceof AuthApiError
          ? error.message
          : 'Unable to reach the server. Check that the backend is running.';

      setStatus({ kind: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="brand-panel" aria-label="About Trimly">
        <div className="brand-glow brand-glow-one" />
        <div className="brand-glow brand-glow-two" />

        <Link className="brand-mark" href="/login" aria-label="Trimly home">
          <span className="brand-icon"><Scissors aria-hidden="true" /></span>
          <span>trimly</span>
        </Link>

        <div className="brand-copy">
          <p className="eyebrow"><Sparkles size={15} aria-hidden="true" /> Your look, on your time</p>
          <h1>Great hair days<br />start right here.</h1>
          <p className="brand-description">
            Book trusted barbers, manage appointments, and keep your style on schedule—all in one place.
          </p>

          <div className="feature-list" aria-label="Trimly benefits">
            <div className="feature-item">
              <span><CalendarCheck2 aria-hidden="true" /></span>
              <div><strong>Easy booking</strong><small>Find the right time in a few taps.</small></div>
            </div>
            <div className="feature-item">
              <span><ShieldCheck aria-hidden="true" /></span>
              <div><strong>Trusted professionals</strong><small>Choose with confidence every time.</small></div>
            </div>
          </div>
        </div>

        <div className="social-proof">
          <div className="avatar-stack" aria-hidden="true">
            <span>JD</span><span>AM</span><span>RK</span>
          </div>
          <p><strong>Loved by style-conscious people</strong><br />who value their time.</p>
        </div>
      </section>

      <section className="form-panel">
        <div className="mobile-brand">
          <span className="brand-icon"><Scissors aria-hidden="true" /></span>
          <span>trimly</span>
        </div>

        <div className="login-card">
          <div className="welcome-icon" aria-hidden="true"><LockKeyhole /></div>
          <div className="form-heading">
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in to Trimly</h2>
            <p>Enter your details to manage your bookings and account.</p>
          </div>

          <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
            <div className="field-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
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
                  placeholder="Enter your password"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
            </div>

            <label className="remember-row">
              <input type="checkbox" name="remember" />
              <span className="custom-checkbox"><Check aria-hidden="true" /></span>
              <span>Keep me signed in</span>
            </label>

            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
              {!isSubmitting && <ArrowRight aria-hidden="true" />}
            </button>

            <p
              className={`form-status form-status-${status.kind}`}
              role={status.kind === 'error' ? 'alert' : 'status'}
              aria-live="polite"
            >
              {status.message}
            </p>
          </form>

          <p className="signup-copy">New to Trimly? <Link href="/sign-up">Create an account</Link></p>
          <p className="terms-copy">
            By continuing, you agree to Trimly&apos;s <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
