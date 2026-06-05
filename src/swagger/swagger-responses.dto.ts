import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PackageType } from '../common/enums';

/** Lỗi chuẩn NestJS */
export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Số điện thoại không hợp lệ',
  })
  message!: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;
}

export class OkResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}

// ——— Auth ———
export class AuthUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  defaultAddress?: string | null;

  @ApiProperty({ example: 'CUSTOMER' })
  role!: string;

  @ApiPropertyOptional()
  status?: string;
}

export class AdminProfileResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ example: 'ADMIN' })
  role!: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token — gửi header Authorization: Bearer <token>' })
  accessToken!: string;

  @ApiProperty({ enum: ['CUSTOMER', 'ADMIN'] })
  role!: string;

  @ApiPropertyOptional({ type: AuthUserResponseDto })
  user?: AuthUserResponseDto;

  @ApiPropertyOptional({ type: AdminProfileResponseDto })
  admin?: AdminProfileResponseDto;

  @ApiPropertyOptional({ example: 'customer' })
  kind?: string;
}

export class RefreshResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  role!: string;

  @ApiPropertyOptional()
  kind?: string;
}

export class SessionResponseDto {
  @ApiProperty()
  role!: string;

  @ApiPropertyOptional()
  kind?: string;

  @ApiPropertyOptional({ type: AuthUserResponseDto })
  profile?: AuthUserResponseDto;
}

// ——— Packages ———
export class PackageSnapshotDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  price?: number | null;

  @ApiProperty()
  type!: string;
}

export class PackagePublicDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'internet-giga' })
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  tagline?: string;

  @ApiPropertyOptional({ enum: PackageType })
  type?: PackageType;

  @ApiPropertyOptional()
  price?: number;

  @ApiPropertyOptional()
  heroImage?: string;

  @ApiPropertyOptional()
  bannerImage?: string;

  @ApiPropertyOptional({ description: 'Object metadata (downloadMbps, audience, …)' })
  metadata?: Record<string, unknown>;
}

// ——— Leads ———
export class LeadCreateResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'NEW' })
  status!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  installAddress!: string;

  @ApiPropertyOptional({ nullable: true })
  packageId?: string | null;

  @ApiPropertyOptional({ type: PackageSnapshotDto, nullable: true })
  packageSnapshot?: PackageSnapshotDto | null;
}

export class LeadPublicItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  installAddress!: string;

  @ApiPropertyOptional({ nullable: true })
  packageId?: string | null;

  @ApiPropertyOptional({ type: PackageSnapshotDto, nullable: true })
  packageSnapshot?: PackageSnapshotDto | null;
}

export class LeadHistoryResponseDto {
  @ApiProperty({ example: '0912345678' })
  phone!: string;

  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [LeadPublicItemDto] })
  items!: LeadPublicItemDto[];
}

// ——— FAQs ———
export class FaqPublicItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  question!: string;

  @ApiProperty({ description: 'Hỗ trợ xuống dòng \\n' })
  answer!: string;

  @ApiProperty()
  displayOrder!: number;
}

export class FaqListResponseDto {
  @ApiProperty({ type: [FaqPublicItemDto] })
  items!: FaqPublicItemDto[];
}

// ——— Navigation ———
export class NavigationMenuItemDto {
  @ApiProperty()
  label!: string;

  @ApiProperty({ example: '/#internet' })
  link!: string;

  @ApiPropertyOptional({ nullable: true })
  packageCode?: string | null;

  @ApiPropertyOptional()
  isNew?: boolean;
}

export class NavigationMenuGroupDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ example: 'wifi' })
  icon!: string;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty({ type: [NavigationMenuItemDto] })
  items!: NavigationMenuItemDto[];
}

export class NavigationListResponseDto {
  @ApiProperty({ type: [NavigationMenuGroupDto] })
  items!: NavigationMenuGroupDto[];
}

// ——— Package quiz ———
export class PackageQuizOptionPublicDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  icon!: string;

  @ApiProperty()
  displayOrder!: number;
}

export class PackageQuizQuestionPublicDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty()
  multiSelect!: boolean;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty({ type: [PackageQuizOptionPublicDto] })
  options!: PackageQuizOptionPublicDto[];
}

export class PackageQuizPublicDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'home-needs' })
  code!: string;

  @ApiPropertyOptional({ nullable: true })
  tagline?: string | null;

  @ApiProperty()
  icon!: string;

  @ApiProperty({ example: 3 })
  questionCount!: number;

  @ApiProperty({ type: [PackageQuizQuestionPublicDto] })
  questions!: PackageQuizQuestionPublicDto[];
}

export class PackageQuizAnswerSummaryDto {
  @ApiProperty()
  questionCode!: string;

  @ApiProperty({ type: [String] })
  optionCodes!: string[];
}

export class PackageQuizRankingDto {
  @ApiProperty({ enum: PackageType })
  packageType!: PackageType;

  @ApiProperty()
  score!: number;

  @ApiProperty()
  label!: string;

  @ApiProperty({ example: '#internet' })
  sectionId!: string;
}

export class PackageQuizRecommendResponseDto {
  @ApiProperty({ example: 'home-needs' })
  quizCode!: string;

  @ApiProperty({ type: [PackageQuizAnswerSummaryDto] })
  answers!: PackageQuizAnswerSummaryDto[];

  @ApiProperty({
    type: [String],
    example: ['FPT_PLAY', 'INTERNET'],
    description: 'INTERNET | SPEEDX | FPT_PLAY | CAMERA | SERVICE',
  })
  recommendedTypes!: string[];

  @ApiProperty({ enum: PackageType })
  primaryType!: PackageType;

  @ApiProperty({ example: '#truyen-hinh' })
  scrollToSection!: string;

  @ApiProperty({
    example: '/ket-qua-tu-van?types=FPT_PLAY,INTERNET&primary=FPT_PLAY',
    description: 'FE navigate tới màn hình danh sách gói gợi ý',
  })
  resultsPath!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty({ type: [PackageQuizRankingDto] })
  rankings!: PackageQuizRankingDto[];

  @ApiProperty({ type: [PackagePublicDto] })
  packages!: PackagePublicDto[];

  @ApiProperty()
  totalPackages!: number;
}

// ——— Me ———
export class MyLeadsListResponseDto {
  @ApiProperty({ type: [LeadPublicItemDto] })
  items!: LeadPublicItemDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}

// ——— Banners ———
export class BannerPublicItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  imageUrl!: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  packageId?: string;
}

export class BannerListResponseDto {
  @ApiProperty({ type: [BannerPublicItemDto] })
  items!: BannerPublicItemDto[];
}
