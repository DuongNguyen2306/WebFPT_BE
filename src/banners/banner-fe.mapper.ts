type LeanBanner = Record<string, unknown> & { _id?: { toString(): string } };

export function toBannerFeResponse(doc: LeanBanner) {
  const imageUrl = String(doc.imageUrl ?? '');
  const subtitle = (doc.subtitle ?? '') as string;
  const title = (doc.title ?? '') as string;
  return {
    id: String(doc._id),
    imageUrl,
    bannerImage: imageUrl,
    title,
    subtitle,
    tagline: subtitle,
    name: title,
    packageId: doc.packageId ? String(doc.packageId) : undefined,
    sortOrder: (doc.sortOrder as number) ?? 0,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toBannerFeList(docs: LeanBanner[]) {
  return docs.map(toBannerFeResponse);
}
