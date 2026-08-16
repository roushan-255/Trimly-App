import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { setDefaultResultOrder } from "node:dns";
import { setDefaultAutoSelectFamily } from "node:net";
import { AppModule } from "./app.module";

async function bootstrap() {
  // Neon advertises IPv4 and IPv6 endpoints. Prefer IPv4 so development does
  // not stall on networks that expose DNS for IPv6 but cannot route it.
  setDefaultResultOrder("ipv4first");
  setDefaultAutoSelectFamily(false);

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  // Vercel forwards the original service path, while local development calls
  // the API directly at localhost:4000 without a prefix.
  if (config.get<string>("VERCEL")) {
    app.setGlobalPrefix("api/backend");
  }

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: config.get<string>("FRONTEND_URL") ?? "http://localhost:3000",
  });
  app.enableShutdownHooks();

  await app.listen(config.get<number>("PORT") ?? 4000);
}

void bootstrap();
