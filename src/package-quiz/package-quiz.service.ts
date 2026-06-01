import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PackageType } from '../common/enums';
import { PackageQuiz, PackageQuizDocument, QuizOption, QuizQuestion } from './package-quiz.schema';
import { CreatePackageQuizDto } from './dto/create-package-quiz.dto';
import { UpdatePackageQuizDto } from './dto/update-package-quiz.dto';
import { RecommendPackageQuizDto } from './dto/recommend-package-quiz.dto';
import { QuizAnswerDto } from './dto/quiz-answer.dto';
import {
  normalizeQuestionsInput,
  toQuizAdminItem,
  toQuizAdminList,
  toQuizPublicItem,
} from './package-quiz.mapper';
import { PACKAGE_TYPE_LABEL, PACKAGE_TYPE_SECTION } from './package-quiz.constants';
import { PackagesService } from '../packages/packages.service';
import { toPackageFeList } from '../packages/package-fe.mapper';

const MAX_PACKAGES_PER_TYPE = 6;
const MAX_PACKAGES_TOTAL = 18;

@Injectable()
export class PackageQuizService {
  constructor(
    @InjectModel(PackageQuiz.name) private readonly model: Model<PackageQuizDocument>,
    private readonly packages: PackagesService,
  ) {}

  async findActivePublic(quizCode?: string) {
    const doc = await this.resolveQuizDoc(quizCode, { visibleOnly: true });
    return toQuizPublicItem(doc as Record<string, unknown>);
  }

  async findAllAdmin() {
    const docs = await this.model
      .find()
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean()
      .exec();
    return { items: toQuizAdminList(docs as Record<string, unknown>[]) };
  }

  async findOneAdmin(id: string) {
    const doc = await this.findDocById(id);
    return toQuizAdminItem(doc as Record<string, unknown>);
  }

  async create(dto: CreatePackageQuizDto) {
    const code = dto.code.trim();
    const exists = await this.model.findOne({ code }).lean().exec();
    if (exists) {
      throw new BadRequestException(`Bộ câu hỏi "${code}" đã tồn tại`);
    }
    const doc = await this.model.create({
      code,
      tagline: dto.tagline?.trim() || undefined,
      icon: dto.icon?.trim() ?? 'wifi',
      displayOrder: dto.displayOrder ?? 0,
      isVisible: dto.isVisible !== false,
      questions: normalizeQuestionsInput(dto.questions),
    });
    return toQuizAdminItem(doc.toObject() as unknown as Record<string, unknown>);
  }

  async update(id: string, dto: UpdatePackageQuizDto) {
    await this.findDocById(id);
    const $set: Record<string, unknown> = {};
    if (dto.code !== undefined) $set.code = dto.code.trim();
    if (dto.tagline !== undefined) $set.tagline = dto.tagline.trim() || undefined;
    if (dto.icon !== undefined) $set.icon = dto.icon.trim();
    if (dto.displayOrder !== undefined) $set.displayOrder = dto.displayOrder;
    if (dto.isVisible !== undefined) $set.isVisible = dto.isVisible;
    if (dto.questions !== undefined) $set.questions = normalizeQuestionsInput(dto.questions);

    const doc = await this.model.findByIdAndUpdate(id, { $set }, { new: true }).lean().exec();
    if (!doc) throw new NotFoundException('Bộ câu hỏi không tồn tại');
    return toQuizAdminItem(doc as Record<string, unknown>);
  }

  async remove(id: string) {
    await this.findDocById(id);
    await this.model.findByIdAndDelete(id).exec();
    return { ok: true };
  }

  async recommend(dto: RecommendPackageQuizDto) {
    const doc = await this.resolveQuizDoc(dto.quizCode, { visibleOnly: true });
    const quiz = doc as PackageQuiz & { _id: unknown };

    const questions = (quiz.questions ?? [])
      .filter((q) => q.isVisible !== false)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    if (!questions.length) {
      throw new BadRequestException('Bộ câu hỏi chưa có câu hỏi hiển thị');
    }

    const answerList = this.normalizeAnswersInput(dto, questions);
    const scores = new Map<PackageType, number>();
    const answeredSummary: { questionCode: string; optionCodes: string[] }[] = [];

    for (const { questionCode, optionCodes } of answerList) {
      const question = questions.find((q) => q.code === questionCode);
      if (!question) {
        throw new BadRequestException(`Câu hỏi không hợp lệ: ${questionCode}`);
      }

      if (!question.multiSelect && optionCodes.length > 1) {
        throw new BadRequestException(`Câu "${questionCode}" chỉ chọn một mục`);
      }

      const selected = new Set(optionCodes);
      const matched: string[] = [];

      for (const opt of question.options ?? []) {
        if (opt.isVisible === false || !selected.has(opt.code)) continue;
        matched.push(opt.code);
        for (const tw of opt.typeWeights ?? []) {
          const prev = scores.get(tw.packageType) ?? 0;
          scores.set(tw.packageType, prev + (tw.weight ?? 1));
        }
      }

      if (!matched.length) {
        throw new BadRequestException(`Chưa chọn đáp án hợp lệ cho câu "${questionCode}"`);
      }

      answeredSummary.push({ questionCode, optionCodes: matched });
    }

    const ranked = [...scores.entries()]
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([packageType, score]) => ({
        packageType,
        score,
        label: PACKAGE_TYPE_LABEL[packageType],
        sectionId: PACKAGE_TYPE_SECTION[packageType],
      }));

    const recommendedTypes = ranked.map((r) => r.packageType);
    const primaryType = recommendedTypes[0] ?? PackageType.INTERNET;
    const typesQuery = recommendedTypes.join(',');
    const resultsPath = `/ket-qua-tu-van?types=${encodeURIComponent(typesQuery)}&primary=${primaryType}`;

    const packageItems = await this.loadRecommendedPackages(recommendedTypes);

    return {
      quizCode: quiz.code,
      answers: answeredSummary,
      recommendedTypes,
      primaryType,
      scrollToSection: PACKAGE_TYPE_SECTION[primaryType],
      resultsPath,
      rankings: ranked,
      message: this.buildMessage(ranked),
      packages: packageItems,
      totalPackages: packageItems.length,
    };
  }

  private normalizeAnswersInput(
    dto: RecommendPackageQuizDto,
    questions: QuizQuestion[],
  ): QuizAnswerDto[] {
    if (dto.answers?.length) {
      return dto.answers.map((a) => ({
        questionCode: a.questionCode.trim(),
        optionCodes: a.optionCodes.map((c) => c.trim()).filter(Boolean),
      }));
    }

    if (dto.optionCodes?.length) {
      const question =
        questions.find((q) => q.code === dto.questionCode) ?? questions[0];
      return [
        {
          questionCode: question.code,
          optionCodes: dto.optionCodes.map((c) => c.trim()).filter(Boolean),
        },
      ];
    }

    throw new BadRequestException('Cần gửi answers (đủ các câu) hoặc optionCodes');
  }

  private async loadRecommendedPackages(types: PackageType[]) {
    const seen = new Set<string>();
    const merged: Record<string, unknown>[] = [];

    for (const type of types) {
      const docs = await this.packages.findActivePublic(type);
      const mapped = toPackageFeList(docs as Record<string, unknown>[]);
      let count = 0;
      for (const pkg of mapped) {
        const id = String(pkg.id ?? '');
        if (!id || seen.has(id) || count >= MAX_PACKAGES_PER_TYPE) continue;
        seen.add(id);
        merged.push({ ...pkg, recommendedType: type });
        count += 1;
        if (merged.length >= MAX_PACKAGES_TOTAL) return merged;
      }
    }

    return merged;
  }

  private buildMessage(
    ranked: { packageType: PackageType; label: string; score: number }[],
  ): string {
    if (!ranked.length) {
      return 'Xem các gói dịch vụ phù hợp bên dưới.';
    }
    if (ranked.length === 1) {
      return `Chúng tôi gợi ý các gói ${ranked[0].label} cho bạn.`;
    }
    const names = ranked.slice(0, 3).map((r) => r.label);
    return `Chúng tôi gợi ý các gói: ${names.join(', ')}.`;
  }

  private async resolveQuizDoc(quizCode: string | undefined, opts: { visibleOnly: boolean }) {
    const filter: Record<string, unknown> = opts.visibleOnly ? { isVisible: true } : {};
    if (quizCode?.trim()) {
      filter.code = quizCode.trim();
    }
    const doc = await this.model
      .findOne(filter)
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean()
      .exec();
    if (!doc) {
      throw new NotFoundException(
        quizCode ? `Không tìm thấy bộ câu hỏi "${quizCode}"` : 'Chưa có bộ câu hỏi gợi ý gói',
      );
    }
    return doc;
  }

  private async findDocById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Bộ câu hỏi không tồn tại');
    }
    const doc = await this.model.findById(id).lean().exec();
    if (!doc) throw new NotFoundException('Bộ câu hỏi không tồn tại');
    return doc;
  }
}
