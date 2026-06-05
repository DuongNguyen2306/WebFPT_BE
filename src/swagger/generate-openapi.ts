/**
 * Xuất file OpenAPI JSON cho FE (Postman / codegen).
 * Usage: npm run swagger:export
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { AppModule } from '../app.module';
import { buildSwaggerDocument } from './swagger-setup';

dotenv.config();

async function run() {
  process.env.SWAGGER_EXPORT = 'true';

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error'],
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const document = buildSwaggerDocument(app);
  const outDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'openapi.json');
  fs.writeFileSync(outPath, JSON.stringify(document, null, 2));

  await app.close();
  console.log(`Đã ghi OpenAPI: ${outPath}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
