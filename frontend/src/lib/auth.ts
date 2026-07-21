export type UserRole = 'CUSTOMER' | 'SHOP_OWNER' | 'BARBER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  phone: string | null;
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
}

interface ErrorResponse {
  message?: string | string[];
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');

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
