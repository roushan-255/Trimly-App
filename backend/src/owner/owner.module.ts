import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { OwnerController } from "./owner.controller";
import { OwnerService } from "./owner.service";

@Module({
  imports: [AuthModule],
  controllers: [OwnerController],
  providers: [OwnerService],
})
export class OwnerModule {}

