'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearAuthSession,
  readAuthSession,
} from '@/lib/auth';

export type Customer = { firstName: string; email: string };

type AuthContextValue = {
  customer: Customer | null;
  signIn: () => void;
  signOut: () => void;
  ready: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function customerFromSession() {
  const session = readAuthSession();
  if (!session || session.user.role !== 'CUSTOMER') return null;
  return {
    firstName: session.user.email.split('@')[0],
    email: session.user.email,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ready, setReady] = useState(false);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncSession = useCallback(() => {
    if (expiryTimer.current) clearTimeout(expiryTimer.current);
    const session = readAuthSession();
    setCustomer(customerFromSession());
    setReady(true);

    if (session) {
      const delay = Math.max(0, session.expiresAt - Date.now());
      expiryTimer.current = setTimeout(() => {
        clearAuthSession();
        setCustomer(null);
      }, delay);
    }
  }, []);

  useEffect(() => {
    syncSession();
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);
    window.addEventListener('storage', syncSession);
    window.addEventListener('focus', syncSession);
    return () => {
      if (expiryTimer.current) clearTimeout(expiryTimer.current);
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('focus', syncSession);
    };
  }, [syncSession]);

  const signOut = useCallback(() => {
    clearAuthSession();
    setCustomer(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ customer, signIn: syncSession, signOut, ready }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
