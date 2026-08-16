import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { CustomerModule } from "./customer/customer.module";
import { OwnerModule } from "./owner/owner.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ShopsModule } from "./shops/shops.module";

// The current upload implementation writes to the local filesystem. Keep it
// available for local development, but do not load it in Vercel's ephemeral
// runtime. Loading Nest's FileInterceptor there also triggers a Vercel CJS
// bundling incompatibility that prevents the entire API from starting.
const localOnlyModules = process.env.VERCEL
  ? []
  : [require("./uploads/uploads.module").UploadsModule];

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
    ...localOnlyModules,
  ],
})
export class AppModule {}
