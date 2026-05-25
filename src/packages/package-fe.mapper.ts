import { PackageType } from '../common/enums';

const DEFAULT_STAT_ICON: Record<PackageType, string> = {
  [PackageType.INTERNET]: 'gauge',
  [PackageType.SPEEDX]: 'gauge',
  [PackageType.FPT_PLAY]: 'tv',
  [PackageType.CAMERA]: 'camera',
  [PackageType.SERVICE]: 'sparkles',
};

type LeanPackage = Record<string, unknown> & {
  _id?: { toString(): string };
  metadata?: Record<string, unknown>;
};

/** Chuẩn hóa body admin / JSON seed → field lưu MongoDB */
export function normalizePackageInput(input: Record<string, unknown>): Record<string, unknown> {
  const tagline = (input.tagline ?? input.shortDescription) as string | undefined;
  const imageUrl = (input.heroImage ?? input.imageUrl) as string | undefined;
  const accentImageUrl = (input.accentImage ??
    input.accentImageUrl ??
    input.secondaryImage) as string | undefined;
  const price = input.price !== undefined ? input.price : input.monthlyPrice;
  const features = (input.features ?? input.bullets ?? input.featureList) as string[] | undefined;

  const metadata: Record<string, unknown> = {
    ...((input.metadata as Record<string, unknown>) ?? {}),
  };

  const promoBadge = input.promoBadge as string | undefined;
  if (promoBadge && metadata.promoBadge === undefined) {
    metadata.promoBadge = promoBadge;
  }

  if (metadata.maxConnectedDevices !== undefined && metadata.maxDevices === undefined) {
    metadata.maxDevices = metadata.maxConnectedDevices;
  }

  const out: Record<string, unknown> = {
    type: input.type,
    code: input.code,
    name: input.name,
    shortName: input.shortName,
    displayCode: input.displayCode,
    shortDescription: tagline ?? input.shortDescription,
    tagline,
    description: input.description,
    promoBadge,
    price,
    priceNote: input.priceNote,
    billingCycle: input.billingCycle,
    speedLabel: input.speedLabel,
    specCaption: input.specCaption,
    specLine: input.specLine,
    statIcon: input.statIcon,
    features: features ?? [],
    imageUrl,
    accentImageUrl,
    metadata,
    isActive: input.isActive,
    sortOrder: input.sortOrder,
  };

  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
}

/** Map document MongoDB → contract FE (public API) */
export function toPackageFeResponse(doc: LeanPackage) {
  const meta = { ...(doc.metadata ?? {}) };
  const type = doc.type as PackageType;

  if (meta.maxConnectedDevices !== undefined && meta.maxDevices === undefined) {
    meta.maxDevices = meta.maxConnectedDevices;
  }

  const tagline = (doc.tagline ?? doc.shortDescription ?? '') as string;
  const heroImage = (doc.heroImage ?? doc.imageUrl ?? '') as string;
  const accentImage = (doc.accentImage ?? doc.accentImageUrl ?? doc.secondaryImage) as
    | string
    | undefined;
  const price = (doc.price !== undefined ? doc.price : doc.monthlyPrice) as number | null;
  const features = (
    (doc.features as string[] | undefined) ??
    (doc.bullets as string[] | undefined) ??
    (doc.featureList as string[] | undefined) ??
    []
  ).filter(Boolean);

  const promoBadge = (doc.promoBadge ?? meta.promoBadge) as string | undefined;
  if (promoBadge) {
    meta.promoBadge = promoBadge;
  }

  return {
    id: String(doc._id),
    code: doc.code,
    type: doc.type,
    name: doc.name,
    shortName: doc.shortName ?? undefined,
    displayCode: doc.displayCode ?? undefined,
    tagline,
    description: doc.description ?? undefined,
    promoBadge: promoBadge ?? undefined,
    price,
    monthlyPrice: price,
    priceNote: doc.priceNote ?? undefined,
    billingCycle: doc.billingCycle,
    speedLabel: doc.speedLabel ?? undefined,
    specCaption: doc.specCaption ?? undefined,
    specLine: doc.specLine ?? undefined,
    features,
    bullets: features,
    featureList: features,
    heroImage,
    accentImage,
    secondaryImage: accentImage,
    imageUrl: heroImage,
    accentImageUrl: accentImage,
    shortDescription: tagline,
    statIcon: (doc.statIcon as string) ?? DEFAULT_STAT_ICON[type] ?? 'sparkles',
    isActive: doc.isActive ?? true,
    sortOrder: doc.sortOrder ?? 0,
    metadata: meta,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toPackageFeList(docs: LeanPackage[]) {
  return docs.map(toPackageFeResponse);
}
