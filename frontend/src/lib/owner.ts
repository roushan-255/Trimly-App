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

export interface OwnerService {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: string;
  isActive: boolean;
  createdAt: string;
}

export interface OwnerVisit {
  id: string;
  visitDate: string;
  status: 'PENDING' | 'CONFIRMED';
  createdAt: string;
  customerName: string;
  barber: { id: string; displayName: string };
  services: { id: string; name: string }[];
}

export interface OwnerShop {
  id: string;
  brandId: string | null;
  brandName: string;
  name: string;
  branchName: string | null;
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
  barbers: OwnerBarber[];
  services: OwnerService[];
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

export function getOwnerVisits(shopId: string) {
  return ownerRequest<OwnerVisit[]>(`/owner/shops/${shopId}/visits`);
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

export type OwnerShopInput = {
  name: string;
  branchName?: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  phone?: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  locality?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
};

export function createOwnerShop(shop: OwnerShopInput) {
  return ownerRequest<OwnerShop>('/owner/shops', {
    method: 'POST',
    body: JSON.stringify(shop),
  });
}

export function createOwnerBranch(
  sourceShopId: string,
  branch: OwnerShopInput & { branchName: string; copyServices: boolean },
) {
  return ownerRequest<OwnerShop>(`/owner/shops/${sourceShopId}/branches`, {
    method: 'POST',
    body: JSON.stringify(branch),
  });
}

export function archiveOwnerShop(shopId: string) {
  return ownerRequest<{ shopId: string; status: 'ARCHIVED' }>(
    `/owner/shops/${shopId}`,
    { method: 'DELETE' },
  );
}

export function updateOwnerShop(shopId: string, shop: OwnerShopInput) {
  return ownerRequest<OwnerShop>(`/owner/shops/${shopId}`, {
    method: 'PUT',
    body: JSON.stringify(shop),
  });
}

export function updateShopBarber(
  shopId: string,
  barberId: string,
  barber: {
    displayName: string;
    email?: string;
    phone?: string | null;
    bio?: string | null;
  },
) {
  return ownerRequest<OwnerBarber>(
    `/owner/shops/${shopId}/barbers/${barberId}`,
    {
      method: 'PUT',
      body: JSON.stringify(barber),
    },
  );
}

export function removeShopBarber(shopId: string, barberId: string) {
  return ownerRequest<{ barberId: string; status: 'REVOKED' }>(
    `/owner/shops/${shopId}/barbers/${barberId}`,
    { method: 'DELETE' },
  );
}

export type OwnerServiceInput = {
  name: string;
  description?: string | null;
  price: number;
};

export function addShopService(shopId: string, service: OwnerServiceInput) {
  return ownerRequest<OwnerService>(`/owner/shops/${shopId}/services`, {
    method: 'POST',
    body: JSON.stringify(service),
  });
}

export function updateShopService(
  shopId: string,
  serviceId: string,
  service: OwnerServiceInput & { isActive: boolean },
) {
  return ownerRequest<OwnerService>(
    `/owner/shops/${shopId}/services/${serviceId}`,
    { method: 'PUT', body: JSON.stringify(service) },
  );
}

export function deactivateShopService(shopId: string, serviceId: string) {
  return ownerRequest<OwnerService>(
    `/owner/shops/${shopId}/services/${serviceId}`,
    { method: 'DELETE' },
  );
}
