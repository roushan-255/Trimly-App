import { Module } from "@nestjs/common";
import { AccessTokenService } from "./access-token.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { BearerTokenGuard } from "./guards/bearer-token.guard";
import { PasswordService } from "./password.service";
import { RolesGuard } from "./guards/roles.guard";

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    AccessTokenService,
    BearerTokenGuard,
    RolesGuard,
  ],
  exports: [
    PasswordService,
    AccessTokenService,
    BearerTokenGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
