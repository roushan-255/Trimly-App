import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { CustomerModule } from "./customer/customer.module";
import { OwnerModule } from "./owner/owner.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ShopsModule } from "./shops/shops.module";
import { UploadsModule } from "./uploads/uploads.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    PrismaModule,
    AuthModule,
    CustomerModule,
    OwnerModule,
    ShopsModule,
    UploadsModule,
  ],
})
export class AppModule {}
