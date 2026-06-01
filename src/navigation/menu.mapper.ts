type LeanMenu = Record<string, unknown> & { _id?: { toString(): string } };
type RawItem = Record<string, unknown>;

function sortItems(items: RawItem[] | undefined) {
  return [...(items ?? [])].sort(
    (a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0),
  );
}

function normalizeItem(item: RawItem) {
  return {
    label: item.label,
    link: item.link,
    packageCode: item.packageCode ? String(item.packageCode) : null,
    displayOrder: Number(item.displayOrder) || 0,
    isNew: item.isNew === true,
    isVisible: item.isVisible !== false,
  };
}

function mapPublicItems(items: RawItem[] | undefined) {
  return sortItems(items)
    .filter((item) => item.isVisible !== false)
    .map((item) => ({
      label: item.label,
      link: item.link,
      packageCode: item.packageCode ? String(item.packageCode) : null,
      isNew: item.isNew === true,
    }));
}

export function toMenuPublicItem(doc: LeanMenu) {
  return {
    id: String(doc._id),
    title: doc.title,
    icon: doc.icon ?? '',
    displayOrder: doc.displayOrder ?? 0,
    items: mapPublicItems(doc.items as RawItem[] | undefined),
  };
}

export function toMenuPublicList(docs: LeanMenu[]) {
  return docs.map(toMenuPublicItem);
}

export function toMenuAdminItem(doc: LeanMenu) {
  return {
    id: String(doc._id),
    title: doc.title,
    icon: doc.icon ?? '',
    displayOrder: doc.displayOrder ?? 0,
    isVisible: doc.isVisible !== false,
    items: sortItems(doc.items as RawItem[] | undefined).map(normalizeItem),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toMenuAdminList(docs: LeanMenu[]) {
  return docs.map(toMenuAdminItem);
}
