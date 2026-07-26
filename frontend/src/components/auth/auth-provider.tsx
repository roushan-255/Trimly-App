'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type Customer = { firstName: string; email: string };
type AuthContextValue = { customer: Customer | null; signIn: (customer: Customer) => void; signOut: () => void; ready: boolean };
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = 'trimly.mock.customer';
const ACCESS_TOKEN_KEY = 'trimly.accessToken';
const USER_KEY = 'trimly.user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setCustomer(JSON.parse(saved) as Customer); setReady(true); }, []);
  const signIn = (nextCustomer: Customer) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCustomer)); setCustomer(nextCustomer); };
  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setCustomer(null);
  };
  return <AuthContext.Provider value={{ customer, signIn, signOut, ready }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
