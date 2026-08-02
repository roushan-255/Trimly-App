import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import { UserRole } from "../generated/prisma/enums";

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 900;
const MINIMUM_SECRET_LENGTH = 32;

export interface AccessTokenResult {
  accessToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
}

@Injectable()
export class AccessTokenService {
  constructor(private readonly config: ConfigService) {}

  issue(user: { id: string; role: UserRole }): AccessTokenResult {
    const secret = this.readSecret();

    const expiresIn = this.readExpiresIn();
    const issuedAt = Math.floor(Date.now() / 1_000);
    const header = this.encode({ alg: "HS256", typ: "JWT" });
    const payload = this.encode({
      sub: user.id,
      role: user.role,
      iat: issuedAt,
      exp: issuedAt + expiresIn,
    });
    const unsignedToken = `${header}.${payload}`;
    const signature = createHmac("sha256", secret)
      .update(unsignedToken)
      .digest("base64url");

    return {
      accessToken: `${unsignedToken}.${signature}`,
      expiresIn,
      tokenType: "Bearer",
    };
  }

  verify(token: string): AccessTokenPayload {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) throw new Error("Invalid token");

      const [encodedHeader, encodedPayload, signature] = parts;
      const header = JSON.parse(
        Buffer.from(encodedHeader, "base64url").toString("utf8"),
      ) as { alg?: unknown; typ?: unknown };
      const payload = JSON.parse(
        Buffer.from(encodedPayload, "base64url").toString("utf8"),
      ) as Partial<AccessTokenPayload>;

      if (header.alg !== "HS256" || header.typ !== "JWT") {
        throw new Error("Unsupported token");
      }

      const expectedSignature = createHmac("sha256", this.readSecret())
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest();
      const suppliedSignature = Buffer.from(signature, "base64url");

      if (
        suppliedSignature.length !== expectedSignature.length ||
        !timingSafeEqual(suppliedSignature, expectedSignature)
      ) {
        throw new Error("Invalid signature");
      }

      if (
        typeof payload.sub !== "string" ||
        typeof payload.iat !== "number" ||
        typeof payload.exp !== "number" ||
        !Object.values(UserRole).includes(payload.role as UserRole) ||
        payload.exp <= Math.floor(Date.now() / 1_000)
      ) {
        throw new Error("Invalid payload");
      }

      return payload as AccessTokenPayload;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }

  private encode(value: object): string {
    return Buffer.from(JSON.stringify(value)).toString("base64url");
  }

  private readSecret(): string {
    const secret = this.config.get<string>("JWT_ACCESS_SECRET");

    if (!secret || secret.length < MINIMUM_SECRET_LENGTH) {
      throw new InternalServerErrorException(
        `JWT_ACCESS_SECRET must contain at least ${MINIMUM_SECRET_LENGTH} characters`,
      );
    }

    return secret;
  }

  private readExpiresIn(): number {
    const configuredValue = this.config.get<string>("JWT_ACCESS_TTL_SECONDS");

    if (configuredValue === undefined) {
      return DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
    }

    const parsedValue = Number(configuredValue);

    if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
      throw new InternalServerErrorException(
        "JWT_ACCESS_TTL_SECONDS must be a positive integer",
      );
    }

    return parsedValue;
  }
}
