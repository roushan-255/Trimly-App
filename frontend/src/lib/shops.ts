import {
  API_URL,
  AuthApiError,
  clearAuthSession,
  readAuthSession,
} from './auth';

export type ShopSort = 'rating' | 'newest' | 'price_low' | 'price_high';

export interface PublicBarber {
  id: string;
  displayName: string;
  bio: string | null;
  rating: number | null;
  reviewCount: number;
}

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: string;
}

export interface BarberAvailability {
  shop: {
    id: string;
    name: string;
    timezone: string;
  };
  barber: {
    id: string;
    displayName: string;
    bio: string | null;
    profileImageUrl: string | null;
    specialties: string[];
    rating: number | null;
    reviewCount: number;
  };
  services: PublicService[];
  selectedServiceIds: string[];
  totalDurationMin: number;
  visitDate: string;
}

export interface CreateBookingInput {
  shopId: string;
  barberId: string;
  serviceIds: string[];
  date: string;
  notes?: string;
}

export interface CreateBookingResponse {
  bookingGroupId: string;
  appointmentIds: string[];
  status: 'CONFIRMED';
  visitDate: string;
}

export interface PublicShop {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageUrls: string[];
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

export interface PublicShopReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: {
    name: string;
    avatar: string | null;
  };
  barberName: string | null;
}

export interface PublicShopReviewsResponse {
  subject: { id: string; name: string };
  reviews: PublicShopReview[];
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
    if (response.status === 401) clearAuthSession();
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

export function getPublicShopReviews(shopId: string) {
  return publicShopRequest<PublicShopReviewsResponse>(`/shops/${shopId}/reviews`);
}

export function getPublicBarberReviews(shopId: string, barberId: string) {
  return publicShopRequest<PublicShopReviewsResponse>(
    `/shops/${shopId}/barbers/${barberId}/reviews`,
  );
}

export function getBarberAvailability(
  shopId: string,
  barberId: string,
  date: string,
  serviceIds?: string[],
) {
  const params = new URLSearchParams({ date });
  serviceIds?.forEach((serviceId) => params.append('serviceId', serviceId));

  return publicShopRequest<BarberAvailability>(
    `/shops/${shopId}/barbers/${barberId}/availability?${params.toString()}`,
  );
}

export async function createBooking(input: CreateBookingInput) {
  const session = readAuthSession();
  if (!session) throw new AuthApiError('Please sign in again to book.', 401);

  const response = await fetch(
    `${API_URL}/shops/${input.shopId}/barbers/${input.barberId}/bookings`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        serviceIds: input.serviceIds,
        date: input.date,
        notes: input.notes,
      }),
      cache: 'no-store',
    },
  );
  const body = (await response.json().catch(() => null)) as
    | CreateBookingResponse
    | ErrorResponse
    | null;

  if (!response.ok) {
    if (response.status === 401) clearAuthSession();
    const message =
      body && 'message' in body
        ? Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message
        : undefined;
    throw new AuthApiError(message ?? 'Unable to confirm booking', response.status);
  }

  return body as CreateBookingResponse;
}
