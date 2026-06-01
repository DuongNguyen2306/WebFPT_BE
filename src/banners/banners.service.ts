import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Banner, BannerDocument } from './banner.schema';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { toBannerFeList, toBannerFeResponse } from './banner-fe.mapper';
import { PackagesService } from '../packages/packages.service';
import { normalizePackageInput } from '../packages/package-fe.mapper';

@Injectable()
export class BannersService {
  constructor(
    @InjectModel(Banner.name) private readonly model: Model<BannerDocument>,
    private readonly packages: PackagesService,
  ) {}

  findActivePublic() {
    return this.model.find({ isActive: true }).sort({ sortOrder: 1 }).lean().exec();
  }

  async findAllAdmin() {
    const docs = await this.model.find().sort({ sortOrder: 1 }).lean().exec();
    return { items: toBannerFeList(docs as Record<string, unknown>[]) };
  }

  async findOneAdmin(id: string) {
    const doc = await this.findDoc(id);
    return toBannerFeResponse(doc as Record<string, unknown>);
  }

  async create(dto: CreateBannerDto) {
    const imageUrl = this.pickImageUrl(dto);
    const payload = {
      imageUrl,
      title: dto.title?.trim() || undefined,
      subtitle: dto.subtitle?.trim() || undefined,
      packageId: dto.packageId && Types.ObjectId.isValid(dto.packageId) ? dto.packageId : undefined,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive !== false,
    };

    if (payload.packageId) {
      await this.syncPackageBanner(payload.packageId, imageUrl, {
        sortOrder: payload.sortOrder,
        isActive: payload.isActive,
      });
    }

    const doc = await this.model.create(payload);
    return toBannerFeResponse(doc.toObject() as unknown as Record<string, unknown>);
  }

  async update(id: string, dto: UpdateBannerDto) {
    const existing = await this.findDoc(id);
    const patch: Record<string, unknown> = {};

    const imageUrl = dto.imageUrl ?? dto.bannerImage;
    if (imageUrl !== undefined) patch.imageUrl = imageUrl.trim();
    if (dto.title !== undefined) patch.title = dto.title.trim() || undefined;
    if (dto.subtitle !== undefined) patch.subtitle = dto.subtitle.trim() || undefined;
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) patch.isActive = dto.isActive;

    const doc = await this.model
      .findByIdAndUpdate(id, { $set: patch }, { new: true })
      .lean()
      .exec();
    if (!doc) throw new NotFoundException('Banner không tồn tại');

    const pkgId = dto.packageId ?? (existing.packageId ? String(existing.packageId) : undefined);
    if (pkgId && Types.ObjectId.isValid(pkgId) && patch.imageUrl) {
      await this.syncPackageBanner(pkgId, String(patch.imageUrl), {
        sortOrder: (patch.sortOrder as number) ?? (doc.sortOrder as number),
        isActive: (patch.isActive as boolean) ?? (doc.isActive as boolean),
      });
    }

    return toBannerFeResponse(doc as Record<string, unknown>);
  }

  async remove(id: string) {
    const doc = await this.findDoc(id);
    if (doc.packageId) {
      await this.packages.updateById(String(doc.packageId), { bannerImageUrl: '' });
    }
    await this.model.findByIdAndDelete(id).exec();
    return { ok: true };
  }

  private pickImageUrl(dto: CreateBannerDto | UpdateBannerDto): string {
    const url = (dto.imageUrl ?? dto.bannerImage)?.trim();
    if (!url) {
      throw new BadRequestException('Cần imageUrl hoặc bannerImage');
    }
    return url;
  }

  private async findDoc(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Banner không tồn tại');
    }
    const doc = await this.model.findById(id).lean().exec();
    if (!doc) throw new NotFoundException('Banner không tồn tại');
    return doc;
  }

  private async syncPackageBanner(
    packageId: string,
    bannerImageUrl: string,
    opts: { sortOrder?: number; isActive?: boolean },
  ) {
    const patch = normalizePackageInput({
      bannerImage: bannerImageUrl,
      sortOrder: opts.sortOrder,
      isActive: opts.isActive,
    });
    await this.packages.updateById(packageId, patch);
  }
}
