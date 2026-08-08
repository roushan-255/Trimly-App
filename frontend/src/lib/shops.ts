import { API_URL, AuthApiError } from './auth';

export type ShopSort = 'rating' | 'newest' | 'price_low' | 'price_high';

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
  locality: string | null;
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

export interface ShopSearchParams {
  location?: string;
  date?: string;
  name?: string;
  services?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  verifiedOnly?: boolean;
  sort?: ShopSort;
  page?: number;
  limit?: number;
}

export interface ShopSearchResponse {
  items: PublicShop[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export interface LocationSuggestion {
  locality: string;
  city: string;
  state: string | null;
  label: string;
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

export function getPublicShops(options: ShopSearchParams = {}) {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 12),
    sort: options.sort ?? 'rating',
  });

  if (options.location?.trim()) params.set('location', options.location.trim());
  if (options.date) params.set('date', options.date);
  if (options.name?.trim()) params.set('name', options.name.trim());
  options.services?.forEach((service) => params.append('service', service));
  if (options.minPrice !== undefined) params.set('minPrice', String(options.minPrice));
  if (options.maxPrice !== undefined) params.set('maxPrice', String(options.maxPrice));
  if (options.minRating !== undefined) params.set('minRating', String(options.minRating));
  if (options.verifiedOnly) params.set('verifiedOnly', 'true');

  return publicShopRequest<ShopSearchResponse>(`/shops?${params.toString()}`);
}

export function getLocationSuggestions(query = '', limit = 8) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (query.trim()) params.set('query', query.trim());
  return publicShopRequest<LocationSuggestion[]>(
    `/shops/locations?${params.toString()}`,
  );
}

export function getServiceOptions(location?: string) {
  const params = new URLSearchParams();
  if (location?.trim()) params.set('location', location.trim());
  const suffix = params.size ? `?${params.toString()}` : '';
  return publicShopRequest<string[]>(`/shops/service-options${suffix}`);
}

export function getPublicShop(shopId: string) {
  return publicShopRequest<PublicShop>(`/shops/${shopId}`);
}
