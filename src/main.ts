import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger/swagger-setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.use(cookieParser());

  const origins =
    process.env.FRONTEND_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ??
    ['http://localhost:5173'];
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  setupSwagger(app);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const discordConfigured = Boolean(process.env.DISCORD_WEBHOOK_URL?.trim());
  console.log(
    `[Bootstrap] Discord webhook: ${discordConfigured ? 'ĐÃ CẤU HÌNH' : 'CHƯA CÓ DISCORD_WEBHOOK_URL'}`,
  );

  const server = await app.listen(port);
  const httpTimeoutMs = Number(process.env.HTTP_REQUEST_TIMEOUT_MS ?? 360_000);
  server.setTimeout(httpTimeoutMs);
}

bootstrap();
