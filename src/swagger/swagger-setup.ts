import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import {
  ApiErrorResponseDto,
  AuthUserResponseDto,
  BannerListResponseDto,
  FaqListResponseDto,
  LeadCreateResponseDto,
  LeadHistoryResponseDto,
  LeadPublicItemDto,
  LoginResponseDto,
  MyLeadsListResponseDto,
  NavigationListResponseDto,
  OkResponseDto,
  PackagePublicDto,
  PackageQuizPublicDto,
  PackageQuizRecommendResponseDto,
  RefreshResponseDto,
  SessionResponseDto,
} from './swagger-responses.dto';
import { CreateLeadDto } from '../leads/dto/create-lead.dto';
import { CreateFaqDto } from '../faqs/dto/create-faq.dto';
import { CreateMenuDto } from '../navigation/dto/create-menu.dto';
import { CreatePackageQuizDto } from '../package-quiz/dto/create-package-quiz.dto';
import { RecommendPackageQuizDto } from '../package-quiz/dto/recommend-package-quiz.dto';
import { RegisterDto } from '../auth/dto/register.dto';
import { UnifiedLoginDto } from '../auth/dto/unified-login.dto';
import { LookupLeadsByPhoneQueryDto } from '../leads/dto/lookup-leads-by-phone.query.dto';
import { PublicPackagesQueryDto } from '../packages/dto/public-packages.query.dto';
import { PackageQuizQueryDto } from '../package-quiz/dto/package-quiz-query.dto';

const SWAGGER_MODELS = [
  ApiErrorResponseDto,
  OkResponseDto,
  LoginResponseDto,
  RefreshResponseDto,
  SessionResponseDto,
  AuthUserResponseDto,
  PackagePublicDto,
  LeadCreateResponseDto,
  LeadPublicItemDto,
  LeadHistoryResponseDto,
  FaqListResponseDto,
  NavigationListResponseDto,
  PackageQuizPublicDto,
  PackageQuizRecommendResponseDto,
  MyLeadsListResponseDto,
  BannerListResponseDto,
  RegisterDto,
  UnifiedLoginDto,
  CreateLeadDto,
  LookupLeadsByPhoneQueryDto,
  PublicPackagesQueryDto,
  PackageQuizQueryDto,
  RecommendPackageQuizDto,
  CreateFaqDto,
  CreateMenuDto,
  CreatePackageQuizDto,
];

const SWAGGER_TAGS: Array<{ name: string; description: string }> = [
  { name: 'Auth', description: 'Đăng ký, đăng nhập, refresh cookie, session' },
  { name: 'Public — Packages', description: 'Danh sách & chi tiết gói cước (khách)' },
  { name: 'Public — Leads', description: 'Đăng ký dịch vụ, tra cứu đơn theo SĐT' },
  { name: 'Public — FAQs', description: 'Câu hỏi thường gặp' },
  { name: 'Public — Navigation', description: 'Mega-menu điều hướng' },
  { name: 'Public — Package quiz', description: 'Khảo sát 3 câu → gợi ý loại gói + list gói' },
  { name: 'Public — Banners', description: 'Carousel banner trang chủ' },
  { name: 'Me (Khách)', description: 'Profile & đơn của tôi (Bearer CUSTOMER)' },
  { name: 'Admin — Auth', description: 'Đăng nhập admin' },
  { name: 'Admin — Packages', description: 'CRUD gói cước' },
  { name: 'Admin — Leads', description: 'Quản lý lead' },
  { name: 'Admin — Banners', description: 'CRUD banner' },
  { name: 'Admin — FAQs', description: 'CRUD FAQ' },
  { name: 'Admin — Navigation', description: 'CRUD menu' },
  { name: 'Admin — Package quiz', description: 'CRUD bộ câu hỏi gợi ý' },
  { name: 'Admin — Uploads', description: 'Upload ảnh Cloudinary' },
];

export function buildSwaggerDocument(app: INestApplication) {
  const config = app.get(ConfigService);
  const publicUrl = config.get<string>('API_PUBLIC_URL')?.replace(/\/+$/, '');
  const port = config.get<number>('PORT') ?? 3000;

  const builder = new DocumentBuilder()
    .setTitle('FPT Telecom Landing API')
    .setDescription(
      [
        'REST API cho landing page & admin FPT Telecom.',
        '',
        '**Base path:** `/api/v1`',
        '',
        '**Xác thực:**',
        '- Access token: header `Authorization: Bearer <accessToken>`',
        '- Refresh token: cookie HttpOnly `refreshToken` (credentials: include)',
        '',
        '**FE public (không bắt buộc login):** packages, leads, faqs, navigation, package-quiz, banners',
        '',
        '**Rate limit:** leads history, lead create theo IP/SĐT',
        '',
        '**Swagger UI:** `/api/docs` · **OpenAPI JSON:** `/api/docs-json`',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .setContact('FPT Telecom BE', '', '')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'accessToken từ login/register/refresh',
      },
      'access-token',
    )
    .addCookieAuth('refreshToken', {
      type: 'apiKey',
      in: 'cookie',
      description: 'Refresh JWT — tự gửi khi credentials: true',
    });

  if (publicUrl) {
    builder.addServer(publicUrl, 'Production / Deploy');
  }
  builder.addServer(`http://localhost:${port}/api/v1`, 'Local development');

  for (const tag of SWAGGER_TAGS) {
    builder.addTag(tag.name, tag.description);
  }

  const swaggerConfig = builder.build();
  return SwaggerModule.createDocument(app, swaggerConfig, {
    extraModels: SWAGGER_MODELS,
  });
}

export function setupSwagger(app: INestApplication) {
  const document = buildSwaggerDocument(app);

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'FPT Telecom API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
    },
  });

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/docs-json', (_req: unknown, res: { json: (d: unknown) => void }) => {
    res.json(document);
  });

  if (process.env.SWAGGER_EXPORT === 'true') {
    const outDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'openapi.json'), JSON.stringify(document, null, 2));
  }

  return document;
}
