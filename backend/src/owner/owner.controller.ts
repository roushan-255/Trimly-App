import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth-user";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { BearerTokenGuard } from "../auth/guards/bearer-token.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "../generated/prisma/enums";
import {
  CreateBarberDto,
  CreateBranchDto,
  CreateServiceDto,
  CreateShopDto,
  UpdateBarberDto,
  UpdateServiceDto,
} from "./dto/owner.dto";
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

  @Put("shops/:shopId")
  updateShop(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Body() dto: CreateShopDto,
  ) {
    return this.owners.updateShop(user, shopId, dto);
  }

  @Delete("shops/:shopId")
  archiveShop(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shopId", ParseUUIDPipe) shopId: string,
  ) {
    return this.owners.archiveShop(user, shopId);
  }

  @Post("shops/:shopId/branches")
  createBranch(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Body() dto: CreateBranchDto,
  ) {
    return this.owners.createBranch(user, shopId, dto);
  }

  @Post("shops/:shopId/barbers")
  addBarber(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Body() dto: CreateBarberDto,
  ) {
    return this.owners.addBarber(user, shopId, dto);
  }

  @Put("shops/:shopId/barbers/:barberId")
  updateBarber(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Param("barberId", ParseUUIDPipe) barberId: string,
    @Body() dto: UpdateBarberDto,
  ) {
    return this.owners.updateBarber(user, shopId, barberId, dto);
  }

  @Delete("shops/:shopId/barbers/:barberId")
  removeBarber(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Param("barberId", ParseUUIDPipe) barberId: string,
  ) {
    return this.owners.removeBarber(user, shopId, barberId);
  }

  @Post("shops/:shopId/services")
  createService(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Body() dto: CreateServiceDto,
  ) {
    return this.owners.createService(user, shopId, dto);
  }

  @Get("shops/:shopId/visits")
  listVisits(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shopId", ParseUUIDPipe) shopId: string,
  ) {
    return this.owners.listVisits(user, shopId);
  }

  @Put("shops/:shopId/services/:serviceId")
  updateService(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Param("serviceId", ParseUUIDPipe) serviceId: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.owners.updateService(user, shopId, serviceId, dto);
  }

  @Delete("shops/:shopId/services/:serviceId")
  deactivateService(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Param("serviceId", ParseUUIDPipe) serviceId: string,
  ) {
    return this.owners.deactivateService(user, shopId, serviceId);
  }
}
