import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BillingCycle, PackageType } from '../../common/enums';
import { CreatePackageDto } from '../dto/admin-package.dto';

const TYPE_ALIASES: Record<string, PackageType> = {
  internet: PackageType.INTERNET,
  INTERNET: PackageType.INTERNET,
  speedx: PackageType.SPEEDX,
  SPEEDX: PackageType.SPEEDX,
  play: PackageType.FPT_PLAY,
  fpt_play: PackageType.FPT_PLAY,
  FPT_PLAY: PackageType.FPT_PLAY,
  camera: PackageType.CAMERA,
  CAMERA: PackageType.CAMERA,
  service: PackageType.SERVICE,
  SERVICE: PackageType.SERVICE,
};

function parseJsonField<T>(raw: string | undefined, field: string): T | undefined {
  if (raw == null || raw === '') return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new BadRequestException(`${field} phải là JSON hợp lệ`);
  }
}

function parseStringArray(raw: string | undefined): string[] | undefined {
  if (raw == null || raw === '') return undefined;
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    const arr = parseJsonField<string[]>(trimmed, 'features');
    return Array.isArray(arr) ? arr.map(String) : undefined;
  }
  return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
}

function parseBoolean(raw: string | undefined): boolean | undefined {
  if (raw == null || raw === '') return undefined;
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return undefined;
}

function parseNumber(raw: string | undefined): number | undefined {
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** Map body multipart (string) → object trước khi validate CreatePackageDto */
export function buildPackageDtoFromForm(body: Record<string, string>): Record<string, unknown> {
  const typeRaw = body.type ?? body.category;
  const type = typeRaw ? TYPE_ALIASES[typeRaw.trim()] ?? typeRaw.trim() : undefined;

  const features =
    parseStringArray(body.features) ??
    parseStringArray(body.bullets) ??
    parseStringArray(body.featureList);

  const metadata = parseJsonField<Record<string, unknown>>(body.metadata, 'metadata');

  const price = parseNumber(body.price) ?? parseNumber(body.monthlyPrice);

  return {
    type,
    code: body.code?.trim(),
    name: body.name?.trim(),
    shortName: body.shortName?.trim(),
    displayCode: body.displayCode?.trim(),
    shortDescription: body.shortDescription?.trim() ?? body.tagline?.trim(),
    tagline: body.tagline?.trim() ?? body.shortDescription?.trim(),
    description: body.description?.trim(),
    promoBadge: body.promoBadge?.trim(),
    price: price ?? (body.price === 'null' ? null : undefined),
    monthlyPrice: parseNumber(body.monthlyPrice),
    priceNote: body.priceNote?.trim(),
    billingCycle: body.billingCycle?.trim() as BillingCycle | undefined,
    speedLabel: body.speedLabel?.trim() ?? body.speed?.trim(),
    specCaption: body.specCaption?.trim(),
    specLine: body.specLine?.trim(),
    statIcon: body.statIcon?.trim(),
    features,
    bullets: features,
    imageUrl: body.imageUrl?.trim() ?? body.heroImage?.trim(),
    heroImage: body.heroImage?.trim() ?? body.imageUrl?.trim(),
    accentImageUrl: body.accentImageUrl?.trim() ?? body.accentImage?.trim(),
    accentImage: body.accentImage?.trim() ?? body.accentImageUrl?.trim(),
    metadata,
    isActive: parseBoolean(body.isActive),
    sortOrder: parseNumber(body.sortOrder),
  };
}

export async function parseAndValidatePackageForm(
  body: Record<string, string>,
): Promise<CreatePackageDto> {
  const plain = buildPackageDtoFromForm(body);
  const dto = plainToInstance(CreatePackageDto, plain, {
    enableImplicitConversion: true,
  });
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: false });
  if (errors.length) {
    const msg = errors
      .flatMap((e) => Object.values(e.constraints ?? {}))
      .join('; ');
    throw new BadRequestException(msg || 'Dữ liệu gói không hợp lệ');
  }
  return dto;
}
