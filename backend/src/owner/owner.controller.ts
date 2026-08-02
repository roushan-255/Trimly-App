import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth-user";
import { BearerTokenGuard } from "../auth/bearer-token.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CreateBarberDto, CreateShopDto } from "./dto/owner.dto";
import { OwnerService } from "./owner.service";

@Controller("owner")
@UseGuards(BearerTokenGuard)
export class OwnerController {
  constructor(private readonly owners: OwnerService) {}

  @Get("shops")
  listShops(@CurrentUser() user: AuthenticatedUser) {
    return this.owners.listShops(user);
  }

  @Post("shops")
  createShop(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateShopDto,
  ) {
    return this.owners.createShop(user, dto);
  }

  @Post("shops/:shopId/barbers")
  addBarber(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Body() dto: CreateBarberDto,
  ) {
    return this.owners.addBarber(user, shopId, dto);
  }
}

