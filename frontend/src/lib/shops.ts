import { API_URL, AuthApiError } from './auth';

export interface PublicBarber {
  id: string;
  displayName: string;
  bio: string | null;
}

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: string;
}

export interface PublicShop {
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
  verified: boolean;
  rating: number | null;
  reviewCount: number;
  barberCount: number;
  serviceCount: number;
  startingPrice: string | null;
  barbers: PublicBarber[];
  services: PublicService[];
}

interface ErrorResponse {
  message?: string | string[];
}

async function publicShopRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const body = (await response.json().catch(() => null)) as
    | T
    | ErrorResponse
    | null;

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body
        ? body.message
        : undefined;
    throw new AuthApiError(
      (Array.isArray(message) ? message.join(', ') : message) ??
        'Unable to load shops',
      response.status,
    );
  }

  return body as T;
}

export function getPublicShops({
  limit = 12,
  search,
}: {
  limit?: number;
  search?: string;
} = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (search?.trim()) params.set('search', search.trim());
  return publicShopRequest<PublicShop[]>(`/shops?${params.toString()}`);
}

export function getPublicShop(shopId: string) {
  return publicShopRequest<PublicShop>(`/shops/${shopId}`);
}

