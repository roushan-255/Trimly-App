import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AccessTokenService } from "../access-token.service";
import type { AuthenticatedUser } from "../auth-user";

export type AuthenticatedRequest = Request & {
  authUser?: AuthenticatedUser;
};

@Injectable()
export class BearerTokenGuard implements CanActivate {
  constructor(private readonly accessTokens: AccessTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    const authorization = request.header("authorization");
    const [scheme, token, extra] = authorization?.split(/\s+/) ?? [];

    if (scheme !== "Bearer" || !token || extra) {
      throw new UnauthorizedException("Bearer access token is required");
    }

    const payload = this.accessTokens.verify(token);
    request.authUser = { id: payload.sub, role: payload.role };
    return true;
  }
}
