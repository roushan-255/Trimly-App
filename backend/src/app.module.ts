import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { OwnerModule } from "./owner/owner.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ShopsModule } from "./shops/shops.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    PrismaModule,
    AuthModule,
    OwnerModule,
    ShopsModule,
  ],
})
export class AppModule {}
