import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  parseAdminSignupDto,
  parseBarberSignupDto,
  parseCustomerSignupDto,
  parseLoginDto,
  parseShopOwnerSignupDto,
} from "./dto/auth-dto.parser";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup/customer")
  signupCustomer(@Body() body: unknown) {
    return this.auth.signupCustomer(parseCustomerSignupDto(body));
  }

  @Post("signup/shop-owner")
  signupShopOwner(@Body() body: unknown) {
    return this.auth.signupShopOwner(parseShopOwnerSignupDto(body));
  }

  @Post("signup/barber")
  signupBarber(@Body() body: unknown) {
    return this.auth.signupBarber(parseBarberSignupDto(body));
  }

  @Post("signup/admin")
  signupAdmin(@Body() body: unknown) {
    return this.auth.signupAdmin(parseAdminSignupDto(body));
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() body: unknown) {
    return this.auth.login(parseLoginDto(body));
  }
}
