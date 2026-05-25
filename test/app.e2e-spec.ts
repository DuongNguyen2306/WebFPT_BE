import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../src/app.module';
import { Package } from '../src/packages/package.schema';
import { BillingCycle, PackageType } from '../src/common/enums';

describe('Telecom API (e2e)', () => {
  let app: NestExpressApplication;
  let mongo: MongoMemoryServer;
  let packageId: string;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
    process.env.JWT_ACCESS_SECRET = 'e2e-access-secret-minimum-32-characters-long';
    process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret-minimum-32-characters-long';
    process.env.JWT_ACCESS_EXPIRES = '15m';
    process.env.JWT_REFRESH_EXPIRES = '7d';
    process.env.FRONTEND_ORIGINS = 'http://localhost:5173';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.set('trust proxy', 1);
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    const pkgModel = app.get(getModelToken(Package.name));
    const doc = await pkgModel.create({
      type: PackageType.INTERNET,
      code: 'internet-e2e',
      name: 'Internet E2E',
      shortDescription: 'Gói test',
      price: 250000,
      priceNote: '/tháng',
      billingCycle: BillingCycle.MONTHLY,
      speedLabel: '300 Mbps',
      features: ['Test'],
      imageUrl: 'https://example.com/img.jpg',
      metadata: { downloadMbps: 300 },
      isActive: true,
      sortOrder: 1,
    });
    packageId = doc._id.toString();
  });

  afterAll(async () => {
    await app.close();
    await mongo.stop();
  });

  it('GET /packages?type=INTERNET returns seeded package', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/packages')
      .query({ type: 'INTERNET' })
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((p: { code: string }) => p.code === 'internet-e2e')).toBe(true);
  });

  it('POST /auth/register creates customer', async () => {
    const username = `user${Date.now().toString(36)}`;
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        username,
        password: 'Password123!',
        fullName: 'E2E User',
      })
      .expect(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.username).toBe(username);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /leads creates lead with snapshot', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('X-Forwarded-For', '203.0.113.10')
      .send({
        fullName: 'Khách test',
        phone: '0912345678',
        installAddress: '123 Đường ABC, Q1, TP.HCM',
        packageId,
      })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('NEW');
    expect(res.body.createdAt).toBeDefined();
  });
});
