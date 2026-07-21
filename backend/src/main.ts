import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get<string>("FRONTEND_URL") ?? "http://localhost:3000",
  });
  app.enableShutdownHooks();

  await app.listen(config.getOrThrow<number>("PORT"));
}

void bootstrap();
