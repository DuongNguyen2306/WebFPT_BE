type LeanLead = Record<string, unknown> & { _id?: { toString(): string } };

export function toLeadPublicItem(doc: LeanLead) {
  const snap = doc.packageSnapshot as Record<string, unknown> | null | undefined;
  return {
    id: String(doc._id),
    status: doc.status,
    createdAt: doc.createdAt,
    fullName: doc.fullName,
    phone: doc.phone,
    installAddress: doc.installAddress,
    packageId: doc.packageId ? String(doc.packageId) : null,
    packageSnapshot: snap
      ? {
          code: snap.code,
          name: snap.name,
          price: snap.price ?? null,
          type: snap.type,
        }
      : null,
  };
}

export function toLeadPublicList(docs: LeanLead[]) {
  return docs.map(toLeadPublicItem);
}
