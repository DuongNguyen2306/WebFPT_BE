import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Package, PackageDocument } from './package.schema';
import { PackageType } from '../common/enums';

@Injectable()
export class PackagesService {
  constructor(@InjectModel(Package.name) private readonly model: Model<PackageDocument>) {}

  findActivePublic(type?: PackageType) {
    const q: FilterQuery<Package> = { isActive: true };
    if (type) q.type = type;
    return this.model.find(q).sort({ type: 1, sortOrder: 1 }).lean().exec();
  }

  async findOneActiveById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Gói không tồn tại');
    }
    const doc = await this.model.findOne({ _id: id, isActive: true }).lean().exec();
    if (!doc) throw new NotFoundException('Gói không tồn tại');
    return doc;
  }

  async findOneActiveByCode(code: string) {
    const doc = await this.model.findOne({ code, isActive: true }).lean().exec();
    if (!doc) throw new NotFoundException('Gói không tồn tại');
    return doc;
  }

  async findByIdForSnapshot(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findOne({ _id: id, isActive: true }).lean().exec();
  }

  async findAdminList(filters: {
    type?: PackageType;
    isActive?: boolean;
    page: number;
    limit: number;
  }) {
    const q: FilterQuery<Package> = {};
    if (filters.type) q.type = filters.type;
    if (filters.isActive !== undefined) q.isActive = filters.isActive;
    const skip = (filters.page - 1) * filters.limit;
    const [items, total] = await Promise.all([
      this.model.find(q).sort({ type: 1, sortOrder: 1 }).skip(skip).limit(filters.limit).lean().exec(),
      this.model.countDocuments(q).exec(),
    ]);
    return { items, total, page: filters.page, limit: filters.limit };
  }

  create(data: Partial<Package>) {
    return this.model.create(data);
  }

  async updateById(id: string, patch: Record<string, unknown>) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Gói không tồn tại');
    }
    const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    const doc = await this.model.findByIdAndUpdate(id, { $set: clean }, { new: true }).exec();
    if (!doc) throw new NotFoundException('Gói không tồn tại');
    return doc;
  }

  async softDelete(id: string) {
    return this.updateById(id, { isActive: false });
  }
}
