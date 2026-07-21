import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac } from "node:crypto";
import { UserRole } from "../generated/prisma/enums";

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 900;
const MINIMUM_SECRET_LENGTH = 32;

export interface AccessTokenResult {
  accessToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

@Injectable()
export class AccessTokenService {
  constructor(private readonly config: ConfigService) {}

  issue(user: { id: string; role: UserRole }): AccessTokenResult {
    const secret = this.config.get<string>("JWT_ACCESS_SECRET");

    if (!secret || secret.length < MINIMUM_SECRET_LENGTH) {
      throw new InternalServerErrorException(
        `JWT_ACCESS_SECRET must contain at least ${MINIMUM_SECRET_LENGTH} characters`,
      );
    }

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

  private encode(value: object): string {
    return Buffer.from(JSON.stringify(value)).toString("base64url");
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
