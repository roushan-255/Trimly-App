import { API_URL, AuthApiError, clearAuthSession, readAuthSession } from './auth';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface CustomerBooking {
  id: string;
  status: AppointmentStatus;
  isUpcoming: boolean;
  dateOnly: boolean;
  visitDate: string;
  startsAt: string;
  endsAt: string;
  durationMin: number;
  totalPrice: string;
  notes: string | null;
  canCancel: boolean;
  canReschedule: boolean;
  shop: {
    id: string;
    name: string;
    addressLine1: string;
    addressLine2: string | null;
    locality: string | null;
    city: string;
    state: string | null;
    postalCode: string;
    timezone: string;
  };
  barber: { id: string; displayName: string };
  services: { id: string; name: string; price: string }[];
  review: BookingReview | null;
}

export interface BookingReview {
  id: string;
  shopRating: number;
  shopComment: string | null;
  barberRating: number;
  barberComment: string | null;
  createdAt: string;
}

export interface SubmitBookingReviewInput {
  shopRating: number;
  shopComment?: string;
  barberRating: number;
  barberComment?: string;
}

export interface CustomerBookingsResponse {
  upcoming: CustomerBooking[];
  past: CustomerBooking[];
}

type ErrorResponse = { message?: string | string[] };

async function customerRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const session = readAuthSession();
  if (!session || session.user.role !== 'CUSTOMER') {
    throw new AuthApiError('Please log in as a customer.', 401);
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
  const body = (await response.json().catch(() => null)) as T | ErrorResponse | null;

  if (!response.ok) {
    if (response.status === 401) clearAuthSession();
    const message = body && typeof body === 'object' && 'message' in body
      ? body.message
      : undefined;
    throw new AuthApiError(
      (Array.isArray(message) ? message.join(', ') : message) ??
        'Unable to update your booking.',
      response.status,
    );
  }

  return body as T;
}

export function getCustomerBookings() {
  return customerRequest<CustomerBookingsResponse>('/customer/bookings');
}

export function cancelCustomerBooking(bookingGroupId: string) {
  return customerRequest<{ bookingGroupId: string; status: 'CANCELLED' }>(
    `/customer/bookings/${bookingGroupId}/cancel`,
    { method: 'PATCH' },
  );
}

export function rescheduleCustomerBooking(bookingGroupId: string, date: string) {
  return customerRequest<{
    bookingGroupId: string;
    status: AppointmentStatus;
    visitDate: string;
  }>(`/customer/bookings/${bookingGroupId}/reschedule`, {
    method: 'PATCH',
    body: JSON.stringify({ date }),
  });
}

export function submitCustomerBookingReview(
  bookingGroupId: string,
  review: SubmitBookingReviewInput,
) {
  return customerRequest<BookingReview>(
    `/customer/bookings/${bookingGroupId}/review`,
    {
      method: 'POST',
      body: JSON.stringify(review),
    },
  );
}
