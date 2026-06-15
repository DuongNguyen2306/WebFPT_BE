import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../src/app.module';
import { Package } from '../src/packages/package.schema';
import { Faq } from '../src/faqs/faq.schema';
import { Menu } from '../src/navigation/menu.schema';
import { PackageQuiz } from '../src/package-quiz/package-quiz.schema';
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

  it('GET /leads/history returns leads by phone', async () => {
    const phone = '0988777666';
    await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('X-Forwarded-For', '203.0.113.11')
      .send({
        fullName: 'Tra cứu test',
        phone,
        installAddress: '456 Đường XYZ',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/v1/leads/history')
      .query({ phone })
      .set('X-Forwarded-For', '203.0.113.12')
      .expect(200);

    expect(res.body.phone).toBe(phone);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].fullName).toBe('Tra cứu test');
    expect(res.body.items[0].packageSnapshot).toBeDefined();
  });

  it('GET /faqs returns only visible FAQs sorted by displayOrder', async () => {
    const faqModel = app.get(getModelToken(Faq.name));
    await faqModel.create([
      {
        question: 'Ẩn',
        answer: 'Không hiện',
        displayOrder: 0,
        isVisible: false,
      },
      {
        question: 'Câu 2',
        answer: 'Trả lời 2',
        displayOrder: 2,
        isVisible: true,
      },
      {
        question: 'Câu 1',
        answer: 'Trả lời 1',
        displayOrder: 1,
        isVisible: true,
      },
    ]);

    const res = await request(app.getHttpServer()).get('/api/v1/faqs').expect(200);

    expect(res.body.items.length).toBeGreaterThanOrEqual(2);
    const visible = res.body.items.filter((f: { question: string }) =>
      ['Câu 1', 'Câu 2'].includes(f.question),
    );
    expect(visible[0].question).toBe('Câu 1');
    expect(visible[1].question).toBe('Câu 2');
    expect(visible.every((f: { isVisible?: boolean }) => f.isVisible === undefined)).toBe(true);
  });

  it('GET /navigation returns visible menu groups with visible items', async () => {
    const menuModel = app.get(getModelToken(Menu.name));
    await menuModel.create({
      title: 'Internet - Wifi',
      icon: 'wifi',
      displayOrder: 0,
      isVisible: true,
      items: [
        { label: 'Internet Wi-Fi 7', link: '/#internet', isNew: false, isVisible: true },
        { label: 'Ẩn', link: '/hidden', isNew: false, isVisible: false },
      ],
    });
    await menuModel.create({
      title: 'Ẩn nhóm',
      icon: 'hidden',
      displayOrder: 99,
      isVisible: false,
      items: [{ label: 'X', link: '/', isVisible: true }],
    });

    const res = await request(app.getHttpServer()).get('/api/v1/navigation').expect(200);

    const group = res.body.items.find((g: { title: string }) => g.title === 'Internet - Wifi');
    expect(group).toBeDefined();
    expect(group.items.length).toBe(1);
    expect(group.items[0].label).toBe('Internet Wi-Fi 7');
    expect(res.body.items.every((g: { title: string }) => g.title !== 'Ẩn nhóm')).toBe(true);
  });

  it('POST /package-quiz/recommend returns package types', async () => {
    const quizModel = app.get(getModelToken(PackageQuiz.name));
    await quizModel.create({
      code: 'e2e-quiz',
      tagline: 'Test',
      icon: 'wifi',
      isVisible: true,
      questions: [
        {
          code: 'q1',
          title: 'Nhu cầu?',
          multiSelect: true,
          isVisible: true,
          options: [
            {
              code: 'game',
              label: 'Game',
              icon: 'gamepad',
              isVisible: true,
              typeWeights: [
                { packageType: 'SPEEDX', weight: 5 },
                { packageType: 'INTERNET', weight: 1 },
              ],
            },
          ],
        },
      ],
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/package-quiz/recommend')
      .send({
        quizCode: 'e2e-quiz',
        answers: [{ questionCode: 'q1', optionCodes: ['game'] }],
      })
      .expect(200);

    expect(res.body.recommendedTypes).toContain('SPEEDX');
    expect(res.body.primaryType).toBe('SPEEDX');
    expect(res.body.resultsPath).toContain('ket-qua-tu-van');
    expect(Array.isArray(res.body.packages)).toBe(true);
  });

  it('GET/PATCH /users/profile and GET /users/registrations', async () => {
    const username = `profile${Date.now().toString(36)}`;
    const phone = '0909111222';

    const reg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        username,
        password: 'Password123!',
        fullName: 'Profile User',
      })
      .expect(201);

    const token = reg.body.accessToken as string;

    await request(app.getHttpServer())
      .patch('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        phone,
        address: '789 Đường Profile, Q3, TP.HCM',
        fullName: 'Profile User Updated',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.fullName).toBe('Profile User Updated');
        expect(res.body.phone).toBe(phone);
        expect(res.body.address).toBe('789 Đường Profile, Q3, TP.HCM');
      });

    await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Forwarded-For', '203.0.113.20')
      .send({
        fullName: 'Profile User Updated',
        phone,
        installAddress: '789 Đường Profile, Q3, TP.HCM',
        packageId,
      })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get('/api/v1/users/registrations')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list.body.total).toBeGreaterThanOrEqual(1);
    expect(list.body.items[0].packageName).toBe('Internet E2E');
    expect(list.body.items[0].speed).toBe('300 Mbps');
    expect(list.body.items[0].statusLabel).toBe('Mới');
    expect(list.body.items[0].createdAt).toBeDefined();
  });
});
