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
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { BearerTokenGuard } from "../auth/guards/bearer-token.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "../generated/prisma/enums";
import { CreateBarberDto, CreateShopDto } from "./dto/owner.dto";
import { OwnerService } from "./owner.service";

@Controller("owner")
@Roles(UserRole.SHOP_OWNER)
@UseGuards(BearerTokenGuard, RolesGuard)
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
