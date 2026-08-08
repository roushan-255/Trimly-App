import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import {
  LocationSuggestionDto,
  ServiceOptionsDto,
  ShopSearchDto,
} from "./dto/shop-search.dto";
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

  @Get(":shopId")
  getById(@Param("shopId", ParseUUIDPipe) shopId: string) {
    return this.shops.getById(shopId);
  }
}
