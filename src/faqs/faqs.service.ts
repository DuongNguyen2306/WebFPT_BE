import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Faq, FaqDocument } from './faq.schema';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { toFaqAdminItem, toFaqAdminList, toFaqPublicList } from './faq.mapper';

@Injectable()
export class FaqsService {
  constructor(@InjectModel(Faq.name) private readonly model: Model<FaqDocument>) {}

  async findVisiblePublic() {
    const docs = await this.model
      .find({ isVisible: true })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean()
      .exec();
    return { items: toFaqPublicList(docs as Record<string, unknown>[]) };
  }

  async findAllAdmin() {
    const docs = await this.model
      .find()
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean()
      .exec();
    return { items: toFaqAdminList(docs as Record<string, unknown>[]) };
  }

  async findOneAdmin(id: string) {
    const doc = await this.findDoc(id);
    return toFaqAdminItem(doc as Record<string, unknown>);
  }

  async create(dto: CreateFaqDto) {
    const doc = await this.model.create({
      question: dto.question.trim(),
      answer: dto.answer.trim(),
      displayOrder: dto.displayOrder ?? 0,
      isVisible: dto.isVisible !== false,
    });
    return toFaqAdminItem(doc.toObject() as unknown as Record<string, unknown>);
  }

  async update(id: string, dto: UpdateFaqDto) {
    await this.findDoc(id);
    const $set: Record<string, unknown> = {};
    if (dto.question !== undefined) $set.question = dto.question.trim();
    if (dto.answer !== undefined) $set.answer = dto.answer.trim();
    if (dto.displayOrder !== undefined) $set.displayOrder = dto.displayOrder;
    if (dto.isVisible !== undefined) $set.isVisible = dto.isVisible;

    const doc = await this.model.findByIdAndUpdate(id, { $set }, { new: true }).lean().exec();
    if (!doc) {
      throw new NotFoundException('FAQ không tồn tại');
    }
    return toFaqAdminItem(doc as Record<string, unknown>);
  }

  async remove(id: string) {
    await this.findDoc(id);
    await this.model.findByIdAndDelete(id).exec();
    return { ok: true };
  }

  private async findDoc(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('FAQ không tồn tại');
    }
    const doc = await this.model.findById(id).lean().exec();
    if (!doc) {
      throw new NotFoundException('FAQ không tồn tại');
    }
    return doc;
  }
}
