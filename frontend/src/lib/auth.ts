export type UserRole = 'CUSTOMER' | 'SHOP_OWNER' | 'BARBER' | 'ADMIN';

export interface AccountUser {
  id: string;
  email: string;
  phone: string | null;
  roles: UserRole[];
}

export interface AuthUser extends AccountUser {
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: AuthUser;
}

interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
}

export interface CustomerSignupInput {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
}

export interface ShopRegistrationInput {
  name: string;
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
}

export interface ShopOwnerSignupInput {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
  businessLegalName?: string;
  gstin?: string;
  panNumber?: string;
  shop: ShopRegistrationInput;
}

export interface SignupResponse {
  user: AccountUser;
}

interface ErrorResponse {
  message?: string | string[];
}

interface CloudinarySignatureResponse {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  uploadPreset: string;
  signature: string;
}

interface CloudinaryUploadResponse {
  secure_url?: string;
  error?: { message?: string };
}

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  '/api/backend'
).replace(/\/+$/, '');
export const AUTH_SESSION_CHANGED_EVENT = 'trimly:auth-session-changed';
const ACCESS_TOKEN_KEY = 'trimly.accessToken';
const USER_KEY = 'trimly.user';
const EXPIRES_AT_KEY = 'trimly.expiresAt';

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
    cache: 'no-store',
  });

  const body = (await response.json().catch(() => null)) as LoginResponse | ErrorResponse | null;

  if (!response.ok) {
    const message = body && 'message' in body ? body.message : undefined;
    const readableMessage = Array.isArray(message) ? message.join(', ') : message;

    throw new AuthApiError(readableMessage ?? 'Unable to sign in', response.status);
  }

  if (
    !body ||
    !('accessToken' in body) ||
    typeof body.accessToken !== 'string' ||
    !('user' in body)
  ) {
    throw new AuthApiError('The server returned an invalid login response', response.status);
  }

  return body as LoginResponse;
}

export function storeAuthSession(auth: LoginResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  localStorage.setItem(
    EXPIRES_AT_KEY,
    String(Date.now() + auth.expiresIn * 1_000),
  );
  notifyAuthSessionChanged();
}

export function readAuthSession(): {
  accessToken: string;
  user: AuthUser;
  expiresAt: number;
} | null {
  if (typeof window === 'undefined') return null;
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY);
  const storedExpiresAt = localStorage.getItem(EXPIRES_AT_KEY);
  if (!accessToken || !storedUser) {
    removeAuthSessionStorage();
    return null;
  }

  try {
    const user = JSON.parse(storedUser) as Partial<AuthUser>;
    const expiresAt = storedExpiresAt
      ? Number(storedExpiresAt)
      : tokenExpiresAt(accessToken);
    if (
      typeof user.id !== 'string' ||
      typeof user.email !== 'string' ||
      !Array.isArray(user.roles) ||
      !user.roles.every((role) =>
        ['CUSTOMER', 'SHOP_OWNER', 'BARBER', 'ADMIN'].includes(role),
      ) ||
      !['CUSTOMER', 'SHOP_OWNER', 'BARBER', 'ADMIN'].includes(user.role ?? '') ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now()
    ) {
      clearAuthSession();
      return null;
    }
    if (!storedExpiresAt) {
      localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
    }
    return { accessToken, user: user as AuthUser, expiresAt };
  } catch {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  removeAuthSessionStorage();
  notifyAuthSessionChanged();
}

function removeAuthSessionStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(EXPIRES_AT_KEY);
}

function notifyAuthSessionChanged() {
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

function tokenExpiresAt(token: string) {
  const encodedPayload = token.split('.')[1];
  if (!encodedPayload) return Number.NaN;
  const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const payload = JSON.parse(atob(padded)) as { exp?: unknown };
  return typeof payload.exp === 'number' ? payload.exp * 1_000 : Number.NaN;
}

export async function signupCustomer(
  customer: CustomerSignupInput,
): Promise<SignupResponse> {
  const response = await fetch(`${API_URL}/auth/signup/customer`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customer),
    cache: 'no-store',
  });

  const body = (await response.json().catch(() => null)) as
    | SignupResponse
    | ErrorResponse
    | null;

  if (!response.ok) {
    const message = body && 'message' in body ? body.message : undefined;
    const readableMessage = Array.isArray(message) ? message.join(', ') : message;
    throw new AuthApiError(readableMessage ?? 'Unable to create your account', response.status);
  }

  if (!body || !('user' in body)) {
    throw new AuthApiError('The server returned an invalid signup response', response.status);
  }

  return body;
}

export async function signupShopOwner(
  owner: ShopOwnerSignupInput,
): Promise<SignupResponse> {
  const response = await fetch(`${API_URL}/auth/signup/shop-owner`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(owner),
    cache: 'no-store',
  });

  const body = (await response.json().catch(() => null)) as
    | SignupResponse
    | ErrorResponse
    | null;

  if (!response.ok) {
    const message = body && 'message' in body ? body.message : undefined;
    const readableMessage = Array.isArray(message) ? message.join(', ') : message;
    throw new AuthApiError(
      readableMessage ?? 'Unable to register your business',
      response.status,
    );
  }

  if (!body || !('user' in body)) {
    throw new AuthApiError(
      'The server returned an invalid owner signup response',
      response.status,
    );
  }

  return body;
}

export async function uploadShopImage(file: File): Promise<string> {
  const signatureResponse = await fetch(
    `${API_URL}/uploads/shop-images/signature`,
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    },
  );
  const signatureBody = (await signatureResponse.json().catch(() => null)) as
    | CloudinarySignatureResponse
    | ErrorResponse
    | null;

  if (!signatureResponse.ok) {
    const message =
      signatureBody && 'message' in signatureBody
        ? signatureBody.message
        : undefined;
    throw new AuthApiError(
      (Array.isArray(message) ? message.join(', ') : message) ??
        'Unable to prepare this image upload',
      signatureResponse.status,
    );
  }

  if (
    !signatureBody ||
    !('uploadUrl' in signatureBody) ||
    typeof signatureBody.uploadUrl !== 'string'
  ) {
    throw new AuthApiError(
      'The server returned an invalid upload signature',
      signatureResponse.status,
    );
  }

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signatureBody.apiKey);
  form.append('timestamp', String(signatureBody.timestamp));
  form.append('folder', signatureBody.folder);
  form.append('upload_preset', signatureBody.uploadPreset);
  form.append('signature', signatureBody.signature);

  const response = await fetch(signatureBody.uploadUrl, {
    method: 'POST',
    body: form,
  });
  const body = (await response.json().catch(() => null)) as
    | CloudinaryUploadResponse
    | null;

  if (!response.ok) {
    throw new AuthApiError(
      body?.error?.message ?? 'Unable to upload this image',
      response.status,
    );
  }

  if (!body?.secure_url) {
    throw new AuthApiError('The server returned an invalid image response', 500);
  }

  return body.secure_url;
}
