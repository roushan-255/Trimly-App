import { Module } from "@nestjs/common";
import { AccessTokenService } from "./access-token.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, PasswordService, AccessTokenService],
})
export class AuthModule {}
