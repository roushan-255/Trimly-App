import { BadRequestException } from "@nestjs/common";
import {
  AdminSignupDto,
  BarberSignupDto,
  CustomerSignupDto,
  LoginDto,
  ShopOwnerSignupDto,
  SignupCredentialsDto,
} from "./auth.dto";

type JsonObject = Record<string, unknown>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readBody(value: unknown): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new BadRequestException("Request body must be a JSON object");
  }

  return value as JsonObject;
}

function requiredString(
  body: JsonObject,
  field: string,
  options: { min?: number; max: number; trim?: boolean } = { max: 255 },
): string {
  const value = body[field];

  if (typeof value !== "string") {
    throw new BadRequestException(`${field} must be a string`);
  }

  const parsed = options.trim === false ? value : value.trim();
  const min = options.min ?? 1;

  if (parsed.length < min || parsed.length > options.max) {
    throw new BadRequestException(
      `${field} must contain between ${min} and ${options.max} characters`,
    );
  }

  return parsed;
}

function optionalString(
  body: JsonObject,
  field: string,
  max: number,
): string | undefined {
  const value = body[field];

  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return requiredString(body, field, { max });
}

function credentials(body: JsonObject): LoginDto {
  const email = requiredString(body, "email", { max: 320 }).toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    throw new BadRequestException("email must be a valid email address");
  }

  return {
    email,
    password: requiredString(body, "password", {
      min: 8,
      max: 128,
      trim: false,
    }),
  };
}

function signupCredentials(body: JsonObject): SignupCredentialsDto {
  const phoneValue = optionalString(body, "phone", 30);
  const phone = phoneValue?.replace(/[\s()-]/g, "");

  if (phone !== undefined && !/^\+?[1-9]\d{7,14}$/.test(phone)) {
    throw new BadRequestException(
      "phone must contain 8 to 15 digits and may start with +",
    );
  }

  return {
    ...credentials(body),
    phone,
  };
}

function personName(
  body: JsonObject,
): Pick<CustomerSignupDto, "firstName" | "lastName"> {
  return {
    firstName: requiredString(body, "firstName", { max: 100 }),
    lastName: requiredString(body, "lastName", { max: 100 }),
  };
}

export function parseLoginDto(value: unknown): LoginDto {
  return credentials(readBody(value));
}

export function parseCustomerSignupDto(value: unknown): CustomerSignupDto {
  const body = readBody(value);

  return {
    ...signupCredentials(body),
    ...personName(body),
    avatar: optionalString(body, "avatar", 2_048),
  };
}

export function parseShopOwnerSignupDto(value: unknown): ShopOwnerSignupDto {
  const body = readBody(value);

  return {
    ...signupCredentials(body),
    ...personName(body),
    avatarUrl: optionalString(body, "avatarUrl", 2_048),
    businessLegalName: optionalString(body, "businessLegalName", 255),
    gstin: optionalString(body, "gstin", 30)?.toUpperCase(),
    panNumber: optionalString(body, "panNumber", 20)?.toUpperCase(),
  };
}

export function parseBarberSignupDto(value: unknown): BarberSignupDto {
  const body = readBody(value);
  const shopId = requiredString(body, "shopId", { max: 36 });

  if (!UUID_PATTERN.test(shopId)) {
    throw new BadRequestException("shopId must be a valid UUID");
  }

  return {
    ...signupCredentials(body),
    shopId,
    displayName: requiredString(body, "displayName", { max: 150 }),
    bio: optionalString(body, "bio", 2_000),
  };
}

export function parseAdminSignupDto(value: unknown): AdminSignupDto {
  const body = readBody(value);

  return {
    ...signupCredentials(body),
    ...personName(body),
    avatarUrl: optionalString(body, "avatarUrl", 2_048),
    designation: optionalString(body, "designation", 150),
    department: optionalString(body, "department", 150),
  };
}
