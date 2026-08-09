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
}

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: string;
}

export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED';

export interface BarberAvailabilitySlot {
  id: string;
  startsAt: string;
  endsAt: string;
  status: SlotStatus;
  bookable: boolean;
  occupiedSlotIds: string[];
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
  slots: BarberAvailabilitySlot[];
}

export interface CreateBookingInput {
  shopId: string;
  barberId: string;
  serviceIds: string[];
  slotIds: string[];
  notes?: string;
}

export interface CreateBookingResponse {
  appointmentIds: string[];
  status: 'CONFIRMED';
  startsAt: string;
  endsAt: string;
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
        slotIds: input.slotIds,
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
