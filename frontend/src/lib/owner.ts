import {
  API_URL,
  AuthApiError,
  clearAuthSession,
  readAuthSession,
} from './auth';

export interface OwnerBarber {
  id: string;
  displayName: string;
  bio: string | null;
  createdAt: string;
  user: { email: string; phone: string | null } | null;
}

export interface OwnerShop {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  createdAt: string;
  barbers: OwnerBarber[];
}

interface ApiError {
  message?: string | string[];
}

async function ownerRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const session = readAuthSession();
  if (!session || session.user.role !== 'SHOP_OWNER') {
    clearAuthSession();
    throw new AuthApiError('Please log in with a shop owner account', 401);
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  });
  const body = (await response.json().catch(() => null)) as T | ApiError | null;
  if (!response.ok) {
    if (response.status === 401) clearAuthSession();
    const message =
      body && typeof body === 'object' && 'message' in body
        ? body.message
        : undefined;
    throw new AuthApiError(
      (Array.isArray(message) ? message.join(', ') : message) ??
        'Unable to complete this request',
      response.status,
    );
  }
  return body as T;
}

export function getOwnerShops() {
  return ownerRequest<OwnerShop[]>('/owner/shops');
}

export function addShopBarber(
  shopId: string,
  barber: {
    displayName: string;
    email: string;
    phone?: string;
    password: string;
    bio?: string;
  },
) {
  return ownerRequest<OwnerBarber>(`/owner/shops/${shopId}/barbers`, {
    method: 'POST',
    body: JSON.stringify(barber),
  });
}
