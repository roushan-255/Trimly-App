import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "../../generated/prisma/enums";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthenticatedRequest } from "./bearer-token.guard";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) return true;

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    const user = request.authUser;

    if (!user) {
      throw new UnauthorizedException("Authentication is required");
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        "Your active account role cannot access this resource",
      );
    }

    return true;
  }
}
