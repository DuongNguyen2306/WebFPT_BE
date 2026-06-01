import { PackageType } from '../common/enums';
import { QuizOption, QuizQuestion } from './package-quiz.schema';

type LeanQuiz = Record<string, unknown> & { _id?: { toString(): string } };

function sortOptions(options: QuizOption[] | undefined) {
  return [...(options ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
}

function sortQuestions(questions: QuizQuestion[] | undefined) {
  return [...(questions ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
}

function toPublicOption(opt: QuizOption) {
  return {
    code: opt.code,
    label: opt.label,
    icon: opt.icon ?? '',
    displayOrder: opt.displayOrder ?? 0,
  };
}

function toPublicQuestion(q: QuizQuestion) {
  return {
    code: q.code,
    title: q.title,
    description: q.description ?? null,
    multiSelect: q.multiSelect !== false,
    displayOrder: q.displayOrder ?? 0,
    options: sortOptions(q.options)
      .filter((o) => o.isVisible !== false)
      .map(toPublicOption),
  };
}

export function toQuizPublicItem(doc: LeanQuiz) {
  const questions = sortQuestions(doc.questions as QuizQuestion[] | undefined).filter(
    (q) => q.isVisible !== false,
  );
  return {
    id: String(doc._id),
    code: doc.code,
    tagline: doc.tagline ?? null,
    icon: doc.icon ?? 'wifi',
    displayOrder: doc.displayOrder ?? 0,
    questionCount: questions.length,
    questions: questions.map(toPublicQuestion),
  };
}

export function toQuizAdminItem(doc: LeanQuiz) {
  return {
    id: String(doc._id),
    code: doc.code,
    tagline: doc.tagline ?? null,
    icon: doc.icon ?? 'wifi',
    displayOrder: doc.displayOrder ?? 0,
    isVisible: doc.isVisible !== false,
    questions: sortQuestions(doc.questions as QuizQuestion[] | undefined).map((q) => ({
      code: q.code,
      title: q.title,
      description: q.description ?? null,
      multiSelect: q.multiSelect !== false,
      displayOrder: q.displayOrder ?? 0,
      isVisible: q.isVisible !== false,
      options: sortOptions(q.options).map((o) => ({
        code: o.code,
        label: o.label,
        icon: o.icon ?? '',
        displayOrder: o.displayOrder ?? 0,
        isVisible: o.isVisible !== false,
        typeWeights: (o.typeWeights ?? []).map((w) => ({
          packageType: w.packageType,
          weight: w.weight ?? 1,
        })),
      })),
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toQuizAdminList(docs: LeanQuiz[]) {
  return docs.map(toQuizAdminItem);
}

export function normalizeQuestionsInput(questions: CreatePackageQuizQuestionInput[]) {
  return questions.map((q, qi) => ({
    code: q.code.trim(),
    title: q.title.trim(),
    description: q.description?.trim() || undefined,
    multiSelect: q.multiSelect !== false,
    displayOrder: q.displayOrder ?? qi,
    isVisible: q.isVisible !== false,
    options: (q.options ?? []).map((o, oi) => ({
      code: o.code.trim(),
      label: o.label.trim(),
      icon: o.icon?.trim() ?? '',
      displayOrder: o.displayOrder ?? oi,
      isVisible: o.isVisible !== false,
      typeWeights: (o.typeWeights ?? []).map((w) => ({
        packageType: w.packageType,
        weight: w.weight ?? 1,
      })),
    })),
  }));
}

export type CreatePackageQuizQuestionInput = {
  code: string;
  title: string;
  description?: string;
  multiSelect?: boolean;
  displayOrder?: number;
  isVisible?: boolean;
  options?: {
    code: string;
    label: string;
    icon?: string;
    displayOrder?: number;
    isVisible?: boolean;
    typeWeights?: { packageType: PackageType; weight?: number }[];
  }[];
};
