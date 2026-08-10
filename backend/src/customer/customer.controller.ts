import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth-user";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { BearerTokenGuard } from "../auth/guards/bearer-token.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "../generated/prisma/enums";
import { CustomerService } from "./customer.service";
import { RescheduleBookingDto, SubmitBookingReviewDto } from "./dto/customer-bookings.dto";

@Controller("customer")
@Roles(UserRole.CUSTOMER)
@UseGuards(BearerTokenGuard, RolesGuard)
export class CustomerController {
  constructor(private readonly customers: CustomerService) {}

  @Get("bookings")
  bookings(@CurrentUser() user: AuthenticatedUser) {
    return this.customers.listBookings(user);
  }

  @Patch("bookings/:bookingGroupId/cancel")
  cancelBooking(@CurrentUser() user: AuthenticatedUser, @Param("bookingGroupId", ParseUUIDPipe) bookingGroupId: string) {
    return this.customers.cancelBooking(user, bookingGroupId);
  }

  @Patch("bookings/:bookingGroupId/reschedule")
  rescheduleBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param("bookingGroupId", ParseUUIDPipe) bookingGroupId: string,
    @Body() dto: RescheduleBookingDto,
  ) {
    return this.customers.rescheduleBooking(user, bookingGroupId, dto);
  }

  @Post("bookings/:bookingGroupId/review")
  submitReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param("bookingGroupId", ParseUUIDPipe) bookingGroupId: string,
    @Body() dto: SubmitBookingReviewDto,
  ) {
    return this.customers.submitReview(user, bookingGroupId, dto);
  }
}
