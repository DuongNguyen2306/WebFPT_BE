import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Telecom Landing API')
    .setDescription(
      'API cho landing đăng ký dịch vụ: gói cước, lead, khách hàng, quản trị. Refresh token được đặt trong cookie HttpOnly (xem README).',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addCookieAuth('refreshToken')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const server = await app.listen(port);
  const httpTimeoutMs = Number(process.env.HTTP_REQUEST_TIMEOUT_MS ?? 360_000);
  server.setTimeout(httpTimeoutMs);
}

bootstrap();
