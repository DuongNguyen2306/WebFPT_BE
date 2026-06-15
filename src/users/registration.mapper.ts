import { getLeadStatusLabelVi } from '../common/utils/lead-status.util';

type LeanLead = Record<string, unknown> & { _id?: { toString(): string } };

export function toRegistrationItem(doc: LeanLead) {
  const snap = doc.packageSnapshot as Record<string, unknown> | null | undefined;
  const status = String(doc.status ?? 'NEW');

  return {
    id: String(doc._id),
    packageName: snap?.name != null ? String(snap.name) : 'Chưa chọn gói',
    status,
    statusLabel: getLeadStatusLabelVi(status),
    speed: snap?.speedLabel != null ? String(snap.speedLabel) : null,
    price:
      snap?.price == null
        ? null
        : typeof snap.price === 'number'
          ? snap.price
          : Number(snap.price) || null,
    createdAt: doc.createdAt,
  };
}

export function toRegistrationList(docs: LeanLead[]) {
  return docs.map(toRegistrationItem);
}
