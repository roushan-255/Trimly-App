import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth-user";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { BearerTokenGuard } from "../auth/guards/bearer-token.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "../generated/prisma/enums";
import {
  BarberAvailabilityDto,
  LocationSuggestionDto,
  ServiceOptionsDto,
  ShopSearchDto,
} from "./dto/shop-search.dto";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { ShopsService } from "./shops.service";

@Controller("shops")
export class ShopsController {
  constructor(private readonly shops: ShopsService) {}

  @Get("locations")
  locations(@Query() query: LocationSuggestionDto) {
    return this.shops.locationSuggestions(query);
  }

  @Get("service-options")
  serviceOptions(@Query() query: ServiceOptionsDto) {
    return this.shops.serviceOptions(query.location);
  }

  @Get()
  list(@Query() query: ShopSearchDto) {
    return this.shops.list(query);
  }

  @Get(":shopId/barbers/:barberId/availability")
  availability(
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Param("barberId", ParseUUIDPipe) barberId: string,
    @Query() query: BarberAvailabilityDto,
  ) {
    return this.shops.barberAvailability(shopId, barberId, query);
  }

  @Post(":shopId/barbers/:barberId/bookings")
  @Roles(UserRole.CUSTOMER)
  @UseGuards(BearerTokenGuard, RolesGuard)
  createBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Param("barberId", ParseUUIDPipe) barberId: string,
    @Body() body: CreateBookingDto,
  ) {
    return this.shops.createBooking(user, shopId, barberId, body);
  }

  @Get(":shopId")
  getById(@Param("shopId", ParseUUIDPipe) shopId: string) {
    return this.shops.getById(shopId);
  }
}
