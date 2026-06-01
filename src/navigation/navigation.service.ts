import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Menu, MenuDocument } from './menu.schema';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import {
  toMenuAdminItem,
  toMenuAdminList,
  toMenuPublicList,
} from './menu.mapper';
import { MenuItemDto } from './dto/menu-item.dto';

@Injectable()
export class NavigationService {
  constructor(@InjectModel(Menu.name) private readonly model: Model<MenuDocument>) {}

  async findVisiblePublic() {
    const docs = await this.model
      .find({ isVisible: true })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean()
      .exec();
    return { items: toMenuPublicList(docs as Record<string, unknown>[]) };
  }

  async findAllAdmin() {
    const docs = await this.model
      .find()
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean()
      .exec();
    return { items: toMenuAdminList(docs as Record<string, unknown>[]) };
  }

  async findOneAdmin(id: string) {
    const doc = await this.findDoc(id);
    return toMenuAdminItem(doc as Record<string, unknown>);
  }

  async create(dto: CreateMenuDto) {
    const doc = await this.model.create({
      title: dto.title.trim(),
      icon: dto.icon?.trim() ?? '',
      displayOrder: dto.displayOrder ?? 0,
      isVisible: dto.isVisible !== false,
      items: this.normalizeItemsDto(dto.items),
    });
    return toMenuAdminItem(doc.toObject() as unknown as Record<string, unknown>);
  }

  async update(id: string, dto: UpdateMenuDto) {
    await this.findDoc(id);
    const $set: Record<string, unknown> = {};
    if (dto.title !== undefined) $set.title = dto.title.trim();
    if (dto.icon !== undefined) $set.icon = dto.icon.trim();
    if (dto.displayOrder !== undefined) $set.displayOrder = dto.displayOrder;
    if (dto.isVisible !== undefined) $set.isVisible = dto.isVisible;
    if (dto.items !== undefined) $set.items = this.normalizeItemsDto(dto.items);

    const doc = await this.model.findByIdAndUpdate(id, { $set }, { new: true }).lean().exec();
    if (!doc) {
      throw new NotFoundException('Nhóm menu không tồn tại');
    }
    return toMenuAdminItem(doc as Record<string, unknown>);
  }

  async remove(id: string) {
    await this.findDoc(id);
    await this.model.findByIdAndDelete(id).exec();
    return { ok: true };
  }

  /** Sắp xếp lại thứ tự cột menu (displayOrder = index trong mảng ids). */
  async reorderGroups(ids: string[]) {
    const unique = [...new Set(ids)];
    if (unique.length !== ids.length) {
      throw new BadRequestException('Danh sách id trùng lặp');
    }
    for (const id of ids) {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Id không hợp lệ: ${id}`);
      }
    }
    const found = await this.model.countDocuments({ _id: { $in: ids } }).exec();
    if (found !== ids.length) {
      throw new NotFoundException('Một hoặc nhiều nhóm menu không tồn tại');
    }
    await Promise.all(
      ids.map((id, index) => this.model.updateOne({ _id: id }, { $set: { displayOrder: index } })),
    );
    return this.findAllAdmin();
  }

  private normalizeItemsDto(items?: MenuItemDto[]) {
    if (!items?.length) return [];
    return items.map((item, index) => ({
      label: item.label.trim(),
      link: item.link.trim(),
      packageCode: item.packageCode?.trim() || undefined,
      displayOrder: item.displayOrder ?? index,
      isNew: item.isNew === true,
      isVisible: item.isVisible !== false,
    }));
  }

  private async findDoc(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Nhóm menu không tồn tại');
    }
    const doc = await this.model.findById(id).lean().exec();
    if (!doc) {
      throw new NotFoundException('Nhóm menu không tồn tại');
    }
    return doc;
  }
}
