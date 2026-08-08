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

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');

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
  localStorage.setItem('trimly.accessToken', auth.accessToken);
  localStorage.setItem('trimly.user', JSON.stringify(auth.user));
}

export function readAuthSession(): { accessToken: string; user: AuthUser } | null {
  const accessToken = localStorage.getItem('trimly.accessToken');
  const storedUser = localStorage.getItem('trimly.user');
  if (!accessToken || !storedUser) return null;

  try {
    const user = JSON.parse(storedUser) as Partial<AuthUser>;
    if (
      typeof user.id !== 'string' ||
      typeof user.email !== 'string' ||
      !Array.isArray(user.roles) ||
      !user.roles.every((role) =>
        ['CUSTOMER', 'SHOP_OWNER', 'BARBER', 'ADMIN'].includes(role),
      ) ||
      !['CUSTOMER', 'SHOP_OWNER', 'BARBER', 'ADMIN'].includes(user.role ?? '')
    ) {
      return null;
    }
    return { accessToken, user: user as AuthUser };
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem('trimly.accessToken');
  localStorage.removeItem('trimly.user');
  localStorage.removeItem('trimly.mock.customer');
  sessionStorage.removeItem('trimly.accessToken');
  sessionStorage.removeItem('trimly.user');
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
