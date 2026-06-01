type LeanFaq = Record<string, unknown> & { _id?: { toString(): string } };

export function toFaqPublicItem(doc: LeanFaq) {
  return {
    id: String(doc._id),
    question: doc.question,
    answer: doc.answer,
    displayOrder: doc.displayOrder ?? 0,
  };
}

export function toFaqAdminItem(doc: LeanFaq) {
  return {
    id: String(doc._id),
    question: doc.question,
    answer: doc.answer,
    displayOrder: doc.displayOrder ?? 0,
    isVisible: doc.isVisible !== false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toFaqPublicList(docs: LeanFaq[]) {
  return docs.map(toFaqPublicItem);
}

export function toFaqAdminList(docs: LeanFaq[]) {
  return docs.map(toFaqAdminItem);
}
