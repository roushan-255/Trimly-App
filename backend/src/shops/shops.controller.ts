import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
} from "@nestjs/common";
import { ShopsService } from "./shops.service";

@Controller("shops")
export class ShopsController {
  constructor(private readonly shops: ShopsService) {}

  @Get()
  list(
    @Query("search") search?: string,
    @Query("limit", new DefaultValuePipe(12), ParseIntPipe) limit?: number,
  ) {
    return this.shops.list(search, limit);
  }

  @Get(":shopId")
  getById(@Param("shopId", ParseUUIDPipe) shopId: string) {
    return this.shops.getById(shopId);
  }
}

