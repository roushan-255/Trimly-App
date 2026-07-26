import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  AdminSignupDto,
  BarberSignupDto,
  CustomerSignupDto,
  LoginDto,
  ShopOwnerSignupDto,
} from "./dto/auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup/customer")
  signupCustomer(@Body() dto: CustomerSignupDto) {
    return this.auth.signupCustomer(dto);
  }

  @Post("signup/shop-owner")
  signupShopOwner(@Body() dto: ShopOwnerSignupDto) {
    return this.auth.signupShopOwner(dto);
  }

  @Post("signup/barber")
  signupBarber(@Body() dto: BarberSignupDto) {
    return this.auth.signupBarber(dto);
  }

  @Post("signup/admin")
  signupAdmin(@Body() dto: AdminSignupDto) {
    return this.auth.signupAdmin(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
}
